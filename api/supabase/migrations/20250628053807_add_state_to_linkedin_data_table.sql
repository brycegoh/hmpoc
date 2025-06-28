-- Add state column to linkedin_data table
ALTER TABLE linkedin_data 
ADD COLUMN state TEXT NOT NULL DEFAULT 'in_queue' 
CHECK (state IN ('in_queue', 'extracting', 'summarising', 'embedding', 'completed'));

-- Add profile_summary column to store AI-generated summary
ALTER TABLE linkedin_data 
ADD COLUMN profile_summary TEXT;

-- Update the profile_data column to be nullable since it will be populated during extraction
ALTER TABLE linkedin_data 
ALTER COLUMN profile_data DROP NOT NULL;
