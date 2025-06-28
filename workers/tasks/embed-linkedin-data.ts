import { Helpers } from 'graphile-worker';
import { GoogleGenAI } from "@google/genai";
import supabase from '../lib/supabaseClient.js';

interface EmbedLinkedInJobPayload {
    linkedin_data_id: string;
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
        .select('user_id, profile_summary, state')
        .eq('id', linkedinDataId)
        .single();
    
    if (error) {
        throw new Error(`Failed to fetch LinkedIn data record: ${error.message}`);
    }
    
    return data;
}

/**
 * Stores the embedding in the database
 */
async function storeLinkedInEmbedding(linkedinDataId: string, embedding: number[]) {
    const embeddingString = `[${embedding.join(',')}]`;
    
    const { error } = await supabase
        .from('linkedin_data')
        .update({ 
            embedding: embeddingString,
            updated_at: new Date().toISOString()
        })
        .eq('id', linkedinDataId);
    
    if (error) {
        throw new Error(`Failed to store LinkedIn embedding: ${error.message}`);
    }
    
    console.log(`✅ LinkedIn embedding stored for record ${linkedinDataId}`);
}

/**
 * Generates embeddings using Google GenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
    console.log(`🧠 Initializing Google GenAI client...`);
    
    // Create Google GenAI client
    const ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    });
    
    console.log(`🔍 Generating embedding for text of length ${text.length}`);
    
    // Generate embedding using Google's model
    const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
    });
    
    // Extract the embedding array with proper error handling
    if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error('No embeddings returned from Google GenAI');
    }
    
    const embeddingData = response.embeddings[0];
    if (!embeddingData || !embeddingData.values) {
        throw new Error('Invalid embedding data structure');
    }
    
    const embedding = embeddingData.values as number[];
    
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    
    return embedding;
}

export default async function embedLinkedInData(payload: EmbedLinkedInJobPayload, helpers: Helpers): Promise<void> {
    const { linkedin_data_id } = payload;
    
    try {
        console.log(`🔗 Starting LinkedIn data embedding for record ${linkedin_data_id}`);
        
        // Fetch the LinkedIn data record
        const linkedinRecord = await getLinkedInDataRecord(linkedin_data_id);
        const { user_id, profile_summary } = linkedinRecord;
        
        if (!profile_summary) {
            throw new Error(`No profile summary found for LinkedIn record ${linkedin_data_id}`);
        }

        console.log(`🔍 Profile summary: ${JSON.stringify(profile_summary)}`);

        // Type cast and validate the JSONB profile_summary
        const summaryData = profile_summary as { summary?: string };
        
        if (!summaryData?.summary) {
            throw new Error(`No summary found for LinkedIn record ${linkedin_data_id}`);
        }
        
        // Update state to embedding
        await updateLinkedInDataState(linkedin_data_id, 'embedding');
        
        console.log(`🤖 Generating embedding for user ${user_id}`);
        
        // Generate embedding from the summary
        const embedding = await generateEmbedding(summaryData.summary);
        
        // Store the embedding
        await storeLinkedInEmbedding(linkedin_data_id, embedding);
        
        // Update state to completed
        await updateLinkedInDataState(linkedin_data_id, 'completed');
                
        console.log(`🎉 LinkedIn data embedding completed successfully for user ${user_id}`);
        
    } catch (error) {
        console.error(`❌ Failed to embed LinkedIn data for ${linkedin_data_id}:`, error);
        throw error;
    }
} 