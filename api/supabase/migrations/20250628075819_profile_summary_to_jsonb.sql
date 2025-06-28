-- Change profile_summary column from TEXT to JSONB for structured data
ALTER TABLE linkedin_data 
ALTER COLUMN profile_summary TYPE JSONB 
USING CASE 
    WHEN profile_summary IS NULL THEN NULL
    ELSE jsonb_build_object('summary', profile_summary)
END;