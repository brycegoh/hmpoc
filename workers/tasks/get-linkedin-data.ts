import { Helpers } from 'graphile-worker';
import { extractLinkedInData, type LinkedInExtractionParams, type LinkedInProfileData } from '../lib/linkedin/extractor.js';
import supabase from '../lib/supabaseClient.js';

interface LinkedInJobPayload {
    linkedin_data_id: string;
}

/**
 * Stores processed LinkedIn data in the database
 * @param linkedinData - The processed LinkedIn profile data
 * @param linkedinDataId - LinkedIn data record ID
 * @param embedding - The generated embedding vector (optional)
 */
async function storeLinkedInData(
    linkedinData: LinkedInProfileData, 
    linkedinDataId: string, 
) {
    console.log(`💾 Storing LinkedIn data for record ${linkedinDataId}`);
    
    try {        
        // Update LinkedIn data in the linkedin_data table
        const { error } = await supabase
            .from('linkedin_data')
            .update({
                profile_data: linkedinData,
                extraction_date: new Date().toISOString()
            })
            .eq('id', linkedinDataId);

        if (error) {
            console.error(`❌ Error storing LinkedIn data for record ${linkedinDataId}:`, error);
            throw error;
        }

    } catch (error) {
        console.error(`❌ Failed to store LinkedIn data for record ${linkedinDataId}:`, error);
        throw error;
    }
}

/**
 * Updates the state of a LinkedIn data record
 */
async function updateLinkedInDataState(linkedinDataId: string, state: string) {
    const { error } = await supabase
        .from('linkedin_data')
        .update({ state })
        .eq('id', linkedinDataId);
    
    if (error) {
        throw new Error(`Failed to update LinkedIn data state: ${error.message}`);
    }
    
    console.log(`📝 Updated LinkedIn data ${linkedinDataId} state to: ${state}`);
}

/**
 * Fetches LinkedIn data record by ID
 */
async function getLinkedInDataRecord(linkedinDataId: string) {
    const { data, error } = await supabase
        .from('linkedin_data')
        .select('user_id, linkedin_url, state')
        .eq('id', linkedinDataId)
        .single();
    
    if (error) {
        throw new Error(`Failed to fetch LinkedIn data record: ${error.message}`);
    }
    
    return data;
}

export default async function getLinkedinData(payload: LinkedInJobPayload, helpers: Helpers): Promise<void> {
    const { linkedin_data_id } = payload;

    if (!linkedin_data_id) {
        throw new Error('LinkedIn data ID is required');
    }
    
    try {
        const linkedinRecord = await getLinkedInDataRecord(linkedin_data_id);
        const { user_id, linkedin_url } = linkedinRecord;
        
        await updateLinkedInDataState(linkedin_data_id, 'extracting');
        
        const linkedinData = await extractLinkedInData({ user_id, linkedin_url });
        
        if (!linkedinData) {
            console.log(`⚠️ No LinkedIn data to process for user ${user_id}`);
            return;
        }

        await storeLinkedInData(linkedinData, linkedin_data_id);
        
        // Enqueue summarization job
        console.log(`📄 Enqueueing summarization job for user ${user_id}`);
        await helpers.addJob('summarize-linkedin-data', {
            linkedin_data_id
        });
        
        console.log(`🎉 LinkedIn data extraction completed and summarization queued for user ${user_id}`);
        
    } catch (error) {
        console.error(`❌ Failed to process LinkedIn data for ${linkedin_data_id}:`, error);
        throw error;
    }
}