import { Helpers } from 'graphile-worker';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import supabase from '../lib/supabaseClient.js';
import type { LinkedInProfileData } from '../lib/linkedin/extractor.js';

interface SummarizeLinkedInJobPayload {
    linkedin_data_id: string;
}

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

// Schema for structured LinkedIn profile summary
const linkedInSummarySchema = z.object({
    first_name: z.string().describe('First name extracted from the profile'),
    last_name: z.string().describe('Last name extracted from the profile'),
    skills: z.array(z.string()).describe('Array of key skills with estimated proficiency levels'),
    summary: z.string().describe('Comprehensive professional summary (2-3 sentences)')
});

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
        .select('user_id, profile_data, state')
        .eq('id', linkedinDataId)
        .single();
    
    if (error) {
        throw new Error(`Failed to fetch LinkedIn data record: ${error.message}`);
    }
    
    return data;
}

/**
 * Stores the LinkedIn summary in the database
 */
async function storeLinkedInSummary(linkedinDataId: string, summaryData: any) {
    const { error } = await supabase
        .from('linkedin_data')
        .update({ 
            profile_summary: summaryData,
            updated_at: new Date().toISOString()
        })
        .eq('id', linkedinDataId);
    
    if (error) {
        throw new Error(`Failed to store LinkedIn summary: ${error.message}`);
    }
    
    console.log(`✅ LinkedIn summary stored for record ${linkedinDataId}`);
}

/**
 * Converts LinkedIn profile data to text for AI processing
 */
function linkedInDataToText(profileData: LinkedInProfileData): string {
    const sections = [];
    
    if (profileData.fullName) {
        sections.push(`Name: ${profileData.fullName}`);
    }
    
    if (profileData.headline) {
        sections.push(`Headline: ${profileData.headline}`);
    }
    
    if (profileData.summary) {
        sections.push(`Summary: ${profileData.summary}`);
    }
    
    if (profileData.experience && profileData.experience.length > 0) {
        sections.push('Experience:');
        profileData.experience.forEach((exp, index) => {
            const duration = exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : 
                            exp.startDate ? `${exp.startDate} - Present` : 'Duration not specified';
            sections.push(`${index + 1}. ${exp.title} at ${exp.company} (${duration})`);
            if (exp.description) {
                sections.push(`   Description: ${exp.description}`);
            }
        });
    }
    
    if (profileData.education && profileData.education.length > 0) {
        sections.push('Education:');
        profileData.education.forEach((edu, index) => {
            const duration = edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : 
                            edu.startDate ? `${edu.startDate}` : 'Duration not specified';
            const degree = edu.degree || 'Degree';
            const field = edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : '';
            sections.push(`${index + 1}. ${degree}${field} at ${edu.school} (${duration})`);
        });
    }
    
    if (profileData.skills && profileData.skills.length > 0) {
        sections.push('Skills:');
        profileData.skills.forEach((skill, index) => {
            const endorsements = skill.endorsements ? ` (${skill.endorsements} endorsements)` : '';
            sections.push(`${index + 1}. ${skill.name}${endorsements}`);
        });
    }
    
    return sections.join('\n');
}

export default async function summarizeLinkedInData(payload: SummarizeLinkedInJobPayload, helpers: Helpers): Promise<void> {
    const { linkedin_data_id } = payload;
    
    try {
        console.log(`🧠 Starting LinkedIn data summarization for record ${linkedin_data_id}`);
        
        // Fetch the LinkedIn data record
        const linkedinRecord = await getLinkedInDataRecord(linkedin_data_id);
        const { user_id, profile_data } = linkedinRecord;
        
        if (!profile_data) {
            throw new Error(`No profile data found for LinkedIn record ${linkedin_data_id}`);
        }
        
        // Update state to summarising
        await updateLinkedInDataState(linkedin_data_id, 'summarising');
        
        // Convert profile data to text for AI processing
        const profileText = linkedInDataToText(profile_data as LinkedInProfileData);
        
        console.log(`🤖 Generating AI summary for user ${user_id}`);
        
        // Generate structured summary using Gemini 2.5 Flash
        const result = await generateObject({
            model: google('gemini-2.0-flash-exp'),
            schema: linkedInSummarySchema,
            prompt: `Analyze the following LinkedIn profile data and extract structured information:

${profileText}

Extract the following information:
1. First name and last name from the profile
2. Key skills with estimated proficiency levels (as an array of strings)
3. A concise professional summary (2-3 sentences)

Be accurate and conservative in your assessments. For skills, include both technical and soft skills mentioned in the profile with context about proficiency level where available.`,
        });
        
        console.log(`🔗 Generated structured summary for user ${user_id}, storing and enqueueing embedding...`);
        
        // Store the structured summary
        await storeLinkedInSummary(linkedin_data_id, result.object);
        
        // Enqueue embedding job
        console.log(`📊 Enqueueing embedding job for user ${user_id}`);
        await helpers.addJob('embed-linkedin-data', {
            linkedin_data_id
        });
                
        console.log(`🎉 LinkedIn data summarization completed and embedding job queued for user ${user_id}`);
        
    } catch (error) {
        console.error(`❌ Failed to summarize LinkedIn data for ${linkedin_data_id}:`, error);
        throw error;
    }
} 