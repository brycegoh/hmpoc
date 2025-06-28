import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export default apifyClient;