CREATE OR REPLACE FUNCTION find_mutual_skill_candidates(
    p_viewer UUID,
    p_limit  INT DEFAULT 100
)
RETURNS TABLE (
    user_id         UUID,
    teaches_me      INT,
    learns_from_me  INT,
    overlap_score   INT
)
LANGUAGE sql
STABLE
AS $$
WITH
/* 1️⃣  Viewer's skill lists */
my_teach AS (              -- skills I CAN teach
    SELECT skill_id
    FROM   user_skills
    WHERE  user_id = p_viewer
      AND  role    = 'teach'
),
my_learn AS (              -- skills I WANT to learn
    SELECT skill_id
    FROM   user_skills
    WHERE  user_id = p_viewer
      AND  role    = 'learn'
),

/* 2️⃣  Block everyone I already swiped on (any status) within last 7 days */
seen AS (
    SELECT candidate_id
    FROM   swipe_history
    WHERE  viewer_id = p_viewer
      AND  created_at >= NOW() - INTERVAL '7 days'
),

/* 3️⃣  Build candidate pool + mutual overlap counts */
candidate AS (
    SELECT
        u.id                                AS match_id,
        COUNT(DISTINCT ut.skill_id)         AS teaches_me,       -- cand → me
        COUNT(DISTINCT ul.skill_id)         AS learns_from_me    -- me   → cand
    FROM       users u

    /* they TEACH a skill I want to learn */
    JOIN user_skills ut
         ON ut.user_id = u.id
        AND ut.role    = 'teach'
        AND ut.skill_id IN (SELECT skill_id FROM my_learn)

    /* they WANT TO LEARN a skill I can teach */
    JOIN user_skills ul
         ON ul.user_id = u.id
        AND ul.role    = 'learn'
        AND ul.skill_id IN (SELECT skill_id FROM my_teach)

    WHERE u.id <>  p_viewer                  -- not myself
      AND u.id NOT IN (SELECT candidate_id FROM seen)

    GROUP BY u.id
),

/* 4️⃣  Simple linear score = teach_overlap + learn_overlap */
scored AS (
    SELECT
        match_id            AS user_id,
        teaches_me,
        learns_from_me,
        teaches_me + learns_from_me AS overlap_score
    FROM   candidate
)

/* 5️⃣  Return strongest p_limit matches */
SELECT *
FROM   scored
ORDER  BY overlap_score DESC
LIMIT  p_limit;
$$;