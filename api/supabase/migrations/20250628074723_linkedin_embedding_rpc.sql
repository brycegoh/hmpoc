CREATE OR REPLACE FUNCTION get_linkedin_embedding_similarities(
    p_viewer_id UUID,
    p_candidate_ids UUID[]
)
RETURNS TABLE (
    candidate_id UUID,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    viewer_embedding vector(768);
    candidate_record RECORD;
    cosine_sim FLOAT;
    normalized_sim FLOAT;
BEGIN
    -- Get viewer's embedding
    SELECT embedding 
    INTO viewer_embedding
    FROM linkedin_data 
    WHERE user_id = p_viewer_id 
      AND state = 'completed' 
      AND embedding IS NOT NULL;
    
    -- If viewer has no embedding, return neutral scores for all candidates
    IF viewer_embedding IS NULL THEN
        FOR candidate_record IN 
            SELECT unnest(p_candidate_ids) AS cand_id
        LOOP
            candidate_id := candidate_record.cand_id;
            similarity := 0.5;
            RETURN NEXT;
        END LOOP;
        RETURN;
    END IF;
    
    -- Calculate similarities for each candidate
    FOR candidate_record IN 
        SELECT ld.user_id, ld.embedding
        FROM linkedin_data ld
        WHERE ld.user_id = ANY(p_candidate_ids)
          AND ld.state = 'completed'
          AND ld.embedding IS NOT NULL
    LOOP
        -- Calculate cosine similarity
        cosine_sim := 1 - (viewer_embedding <=> candidate_record.embedding);
        
        -- Normalize from [-1, 1] to [0, 1]
        normalized_sim := (cosine_sim + 1) / 2;
        
        candidate_id := candidate_record.user_id;
        similarity := normalized_sim;
        RETURN NEXT;
    END LOOP;
    
    -- For candidates without embeddings, return neutral scores
    FOR candidate_record IN 
        SELECT unnest(p_candidate_ids) AS cand_id
        WHERE unnest(p_candidate_ids) NOT IN (
            SELECT ld.user_id 
            FROM linkedin_data ld 
            WHERE ld.user_id = ANY(p_candidate_ids)
              AND ld.state = 'completed'
              AND ld.embedding IS NOT NULL
        )
    LOOP
        candidate_id := candidate_record.cand_id;
        similarity := 0.5;
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;