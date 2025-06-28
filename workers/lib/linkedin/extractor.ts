// import apifyClient from '../apifyClient.js';

import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({
    token: "apify_api_TDFfS75JPkShonc7dRMaZ6eOr50vd101Ojh2",
});


const LINKEDIN_ACTOR_ID = "2SyF0bVxmgGr8IVCZ";

interface LinkedInExperience {
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

interface LinkedInEducation {
    school?: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
}

interface LinkedInSkill {
    name?: string;
    endorsements?: number;
}

interface LinkedInProfileData {
    fullName?: string;
    headline?: string;
    location?: string;
    experience?: LinkedInExperience[];
    education?: LinkedInEducation[];
    skills?: LinkedInSkill[];
    summary?: string;
    profilePictureUrl?: string;
    connectionsCount?: number;
    followersCount?: number;
    [key: string]: any; // Allow for additional fields that might be returned
}

interface ApifyDatasetResponse {
    items: LinkedInProfileData[];
}

export interface LinkedInExtractionParams {
    user_id: string;
    linkedin_url: string;
}

export type { LinkedInProfileData, LinkedInExperience, LinkedInEducation, LinkedInSkill };

/**
 * Extracts LinkedIn profile data using Apify actor
 * @param params - The extraction parameters
 * @returns The extracted LinkedIn profile data or null if no data found
 */
export async function extractLinkedInData(params: LinkedInExtractionParams): Promise<LinkedInProfileData | null> {
    const { user_id, linkedin_url } = params;
    
    console.log(`🔍 Starting LinkedIn data extraction for user ${user_id} with URL: ${linkedin_url}`);
    
    try {
        // Prepare Actor input with the user's LinkedIn URL
        const input = {
            "profileUrls": [linkedin_url]
        };

        // Run the Actor and wait for it to finish
        const run = await apifyClient.actor(LINKEDIN_ACTOR_ID).call(input);
        
        // Fetch and print Actor results from the run's dataset (if any)
        console.log(`📊 LinkedIn data extraction completed for user ${user_id}`);
        const { items }: ApifyDatasetResponse = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
        if (items.length > 0) {
            const linkedinData: LinkedInProfileData = items[0];
            console.log(`✅ Successfully extracted LinkedIn data for user ${user_id}:`, {
                fullName: linkedinData.fullName,
                headline: linkedinData.headline,
                location: linkedinData.location,
                experienceCount: Array.isArray(linkedinData.experience) ? linkedinData.experience.length : 0,
                educationCount: Array.isArray(linkedinData.education) ? linkedinData.education.length : 0,
                skillsCount: Array.isArray(linkedinData.skills) ? linkedinData.skills.length : 0
            });
            
            return linkedinData;
        } else {
            console.log(`⚠️ No LinkedIn data found for user ${user_id}`);
            return null;
        }
        
    } catch (error) {
        console.error(`❌ Failed to extract LinkedIn data for user ${user_id}:`, error);
        throw error;
    }
}