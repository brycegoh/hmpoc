CREATE TABLE linkedin_data (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linkedin_url        TEXT        NOT NULL,
    profile_data        JSONB       NOT NULL,
    embedding           vector(384), -- BAAI/bge-small-en-v1.5 produces 384-dimensional vectors
    extraction_date     TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one LinkedIn profile per user
    UNIQUE (user_id)
);

-- Index for faster lookups
CREATE INDEX idx_linkedin_data_user_id ON linkedin_data (user_id);

-- Vector similarity search index using HNSW algorithm
CREATE INDEX idx_linkedin_data_embedding ON linkedin_data USING hnsw (embedding vector_cosine_ops);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_linkedin_data_updated_at
    BEFORE UPDATE ON linkedin_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
