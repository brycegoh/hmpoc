-- SEED DATA
INSERT INTO sys_match_weights (key, value) VALUES
  ('mutual',0.35),
  ('reliability',0.25),
  ('timezone',0.15),
  ('age',0.10),
  ('gender',0.05),
  ('embedding',0.10)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value;

-- SKILLS SEED DATA
INSERT INTO skills (name) VALUES
  ('JavaScript'),
  ('Python'),
  ('React'),
  ('Node.js'),
  ('SQL'),
  ('Machine Learning'),
  ('Data Analysis'),
  ('UI/UX Design'),
  ('Photography'),
  ('Spanish'),
  ('French'),
  ('German'),
  ('Chinese'),
  ('Guitar'),
  ('Piano'),
  ('Cooking'),
  ('Baking'),
  ('Yoga'),
  ('Public Speaking'),
  ('Project Management'),
  ('Digital Marketing'),
  ('Content Writing'),
  ('Video Editing'),
  ('Graphic Design'),
  ('Excel'),
  ('Fitness Training'),
  ('Math Tutoring'),
  ('Writing'),
  ('Drawing'),
  ('Dance'),
  ('Music Theory'),
  ('Italian')
ON CONFLICT (name) DO NOTHING;

-- SEED USERS
INSERT INTO users (first_name, last_name, birthdate, gender, tz_name) VALUES
  ('Alice', 'Johnson', '1992-05-15', 'F', 'America/New_York'),
  ('Bob', 'Smith', '1988-12-03', 'M', 'Europe/London'),
  ('Carol', 'Davis', '1995-08-22', 'F', 'Asia/Tokyo'),
  ('David', 'Wilson', '1990-01-10', 'M', 'America/Los_Angeles'),
  ('Emma', 'Brown', '1993-11-07', 'F', 'Europe/Paris'),
  ('Frank', 'Miller', '1987-03-28', 'M', 'Australia/Sydney'),
  ('Grace', 'Taylor', '1991-09-14', 'F', 'America/Chicago'),
  ('Henry', 'Anderson', '1994-06-25', 'M', 'Europe/Berlin'),
  ('Ivy', 'Thomas', '1989-04-12', 'F', 'Asia/Singapore'),
  ('Jack', 'White', '1996-07-30', 'M', 'America/Denver'),
  ('Kate', 'Harris', '1985-02-18', 'F', 'Europe/Rome'),
  ('Leo', 'Clark', '1992-10-05', 'M', 'Asia/Mumbai'),
  ('Maya', 'Lewis', '1994-12-11', 'F', 'America/Seattle'),
  ('Noah', 'Walker', '1991-08-09', 'M', 'Europe/Amsterdam'),
  ('Olivia', 'Hall', '1988-03-16', 'F', 'Australia/Melbourne');

-- SEED USER SKILLS
-- We'll use a WITH clause to get skill IDs and user IDs, then insert user_skills
WITH skill_ids AS (
  SELECT name, id FROM skills
), user_ids AS (
  SELECT first_name, last_name, id FROM users
)
INSERT INTO user_skills (user_id, skill_id, role, level) 
SELECT u.id, s.id, role, level FROM user_ids u, skill_ids s, (VALUES
  -- Alice Johnson (Frontend Developer wanting to learn Backend)
  ('Alice', 'Johnson', 'JavaScript', 'teach'::skill_role, 'Expert'),
  ('Alice', 'Johnson', 'React', 'teach'::skill_role, 'Advanced'),
  ('Alice', 'Johnson', 'UI/UX Design', 'teach'::skill_role, 'Intermediate'),
  ('Alice', 'Johnson', 'Python', 'learn'::skill_role, null),
  ('Alice', 'Johnson', 'Node.js', 'learn'::skill_role, null),
  ('Alice', 'Johnson', 'Spanish', 'learn'::skill_role, null),

  -- Bob Smith (Backend Developer wanting to learn Frontend & Languages)
  ('Bob', 'Smith', 'Python', 'teach', 'Expert'),
  ('Bob', 'Smith', 'SQL', 'teach', 'Advanced'),
  ('Bob', 'Smith', 'Machine Learning', 'teach', 'Intermediate'),
  ('Bob', 'Smith', 'JavaScript', 'learn', null),
  ('Bob', 'Smith', 'React', 'learn', null),
  ('Bob', 'Smith', 'French', 'learn', null),

  -- Carol Davis (Designer wanting to learn Tech & Music)
  ('Carol', 'Davis', 'UI/UX Design', 'teach', 'Expert'),
  ('Carol', 'Davis', 'Graphic Design', 'teach', 'Advanced'),
  ('Carol', 'Davis', 'Photography', 'teach', 'Intermediate'),
  ('Carol', 'Davis', 'JavaScript', 'learn', null),
  ('Carol', 'Davis', 'Piano', 'learn', null),
  ('Carol', 'Davis', 'Chinese', 'learn', null),

  -- David Wilson (Full Stack Developer wanting to learn Creative Skills)
  ('David', 'Wilson', 'JavaScript', 'teach', 'Advanced'),
  ('David', 'Wilson', 'Node.js', 'teach', 'Expert'),
  ('David', 'Wilson', 'React', 'teach', 'Advanced'),
  ('David', 'Wilson', 'Photography', 'learn', null),
  ('David', 'Wilson', 'Guitar', 'learn', null),
  ('David', 'Wilson', 'Cooking', 'learn', null),

  -- Emma Brown (Data Scientist wanting to learn Languages & Fitness)
  ('Emma', 'Brown', 'Python', 'teach', 'Expert'),
  ('Emma', 'Brown', 'Data Analysis', 'teach', 'Advanced'),
  ('Emma', 'Brown', 'Machine Learning', 'teach', 'Expert'),
  ('Emma', 'Brown', 'French', 'learn', null),
  ('Emma', 'Brown', 'Yoga', 'learn', null),
  ('Emma', 'Brown', 'UI/UX Design', 'learn', null),

  -- Frank Miller (Project Manager wanting to learn Tech)
  ('Frank', 'Miller', 'Project Management', 'teach', 'Expert'),
  ('Frank', 'Miller', 'Public Speaking', 'teach', 'Advanced'),
  ('Frank', 'Miller', 'Digital Marketing', 'teach', 'Intermediate'),
  ('Frank', 'Miller', 'Python', 'learn', null),
  ('Frank', 'Miller', 'SQL', 'learn', null),
  ('Frank', 'Miller', 'Guitar', 'learn', null),

  -- Grace Taylor (Content Creator wanting to learn Tech & Music)
  ('Grace', 'Taylor', 'Content Writing', 'teach', 'Expert'),
  ('Grace', 'Taylor', 'Video Editing', 'teach', 'Advanced'),
  ('Grace', 'Taylor', 'Digital Marketing', 'teach', 'Advanced'),
  ('Grace', 'Taylor', 'JavaScript', 'learn', null),
  ('Grace', 'Taylor', 'Piano', 'learn', null),
  ('Grace', 'Taylor', 'Photography', 'learn', null),

  -- Henry Anderson (Musician wanting to learn Tech & Languages)
  ('Henry', 'Anderson', 'Guitar', 'teach', 'Expert'),
  ('Henry', 'Anderson', 'Piano', 'teach', 'Advanced'),
  ('Henry', 'Anderson', 'Music Theory', 'teach', 'Expert'),
  ('Henry', 'Anderson', 'JavaScript', 'learn', null),
  ('Henry', 'Anderson', 'German', 'learn', null),
  ('Henry', 'Anderson', 'Video Editing', 'learn', null),

  -- Ivy Thomas (Language Teacher wanting to learn Tech)
  ('Ivy', 'Thomas', 'Chinese', 'teach', 'Native'),
  ('Ivy', 'Thomas', 'Spanish', 'teach', 'Advanced'),
  ('Ivy', 'Thomas', 'French', 'teach', 'Intermediate'),
  ('Ivy', 'Thomas', 'Python', 'learn', null),
  ('Ivy', 'Thomas', 'Data Analysis', 'learn', null),
  ('Ivy', 'Thomas', 'Yoga', 'learn', null),

  -- Jack White (Fitness Trainer wanting to learn Creative Skills)
  ('Jack', 'White', 'Fitness Training', 'teach', 'Expert'),
  ('Jack', 'White', 'Yoga', 'teach', 'Advanced'),
  ('Jack', 'White', 'Cooking', 'teach', 'Intermediate'),
  ('Jack', 'White', 'Photography', 'learn', null),
  ('Jack', 'White', 'Guitar', 'learn', null),
  ('Jack', 'White', 'Video Editing', 'learn', null),

  -- Kate Harris (Chef wanting to learn Business & Languages)
  ('Kate', 'Harris', 'Cooking', 'teach', 'Expert'),
  ('Kate', 'Harris', 'Baking', 'teach', 'Advanced'),
  ('Kate', 'Harris', 'Italian', 'teach', 'Native'),
  ('Kate', 'Harris', 'Project Management', 'learn', null),
  ('Kate', 'Harris', 'Digital Marketing', 'learn', null),
  ('Kate', 'Harris', 'Spanish', 'learn', null),

  -- Leo Clark (Math Tutor wanting to learn Tech & Music)
  ('Leo', 'Clark', 'Math Tutoring', 'teach', 'Expert'),
  ('Leo', 'Clark', 'Excel', 'teach', 'Advanced'),
  ('Leo', 'Clark', 'Data Analysis', 'teach', 'Intermediate'),
  ('Leo', 'Clark', 'Python', 'learn', null),
  ('Leo', 'Clark', 'Machine Learning', 'learn', null),
  ('Leo', 'Clark', 'Piano', 'learn', null),

  -- Maya Lewis (Artist wanting to learn Tech & Business)
  ('Maya', 'Lewis', 'Drawing', 'teach', 'Expert'),
  ('Maya', 'Lewis', 'Graphic Design', 'teach', 'Advanced'),
  ('Maya', 'Lewis', 'Photography', 'teach', 'Intermediate'),
  ('Maya', 'Lewis', 'JavaScript', 'learn', null),
  ('Maya', 'Lewis', 'UI/UX Design', 'learn', null),
  ('Maya', 'Lewis', 'Digital Marketing', 'learn', null),

  -- Noah Walker (Dancer wanting to learn Tech & Languages)
  ('Noah', 'Walker', 'Dance', 'teach', 'Expert'),
  ('Noah', 'Walker', 'Fitness Training', 'teach', 'Advanced'),
  ('Noah', 'Walker', 'Public Speaking', 'teach', 'Intermediate'),
  ('Noah', 'Walker', 'Video Editing', 'learn', null),
  ('Noah', 'Walker', 'German', 'learn', null),
  ('Noah', 'Walker', 'Photography', 'learn', null),

  -- Olivia Hall (Business Analyst wanting to learn Creative Skills)
  ('Olivia', 'Hall', 'Excel', 'teach', 'Expert'),
  ('Olivia', 'Hall', 'Data Analysis', 'teach', 'Advanced'),
  ('Olivia', 'Hall', 'Project Management', 'teach', 'Advanced'),
  ('Olivia', 'Hall', 'Drawing', 'learn', null),
  ('Olivia', 'Hall', 'Piano', 'learn', null),
  ('Olivia', 'Hall', 'Cooking', 'learn', null)
) AS v(first_name, last_name, skill_name, role, level)
WHERE u.first_name = v.first_name AND u.last_name = v.last_name AND s.name = v.skill_name;

-- SEED LINKEDIN DATA WITH FAKE EMBEDDINGS
-- Create realistic LinkedIn profiles and embeddings for our seed users
WITH user_profiles AS (
  SELECT u.id, u.first_name, u.last_name FROM users u WHERE u.first_name IN (
    'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Maya', 'Noah', 'Olivia'
  )
)
INSERT INTO linkedin_data (user_id, linkedin_url, embedding, state)
SELECT 
  up.id,
  'https://linkedin.com/in/' || lower(up.first_name) || '-' || lower(up.last_name) || '-' || substring(up.id::text, 1, 8),
  embedding::vector(768),
  'completed'
FROM user_profiles up
CROSS JOIN (VALUES
     -- Alice Johnson - Frontend Developer
        ('Alice', 'Johnson', 
    '[' || array_to_string(array(select (0.1 + random() * 0.8)::text from generate_series(1, 768)), ',') || ']'),

  -- Bob Smith - Backend Developer  
  ('Bob', 'Smith',
   '[' || array_to_string(array(select (0.2 + random() * 0.6)::text from generate_series(1, 768)), ',') || ']'),

  -- Carol Davis - UX/UI Designer
  ('Carol', 'Davis',
   '[' || array_to_string(array(select (0.15 + random() * 0.7)::text from generate_series(1, 768)), ',') || ']'),

  -- David Wilson - Full Stack Developer
  ('David', 'Wilson',
   '[' || array_to_string(array(select (0.12 + random() * 0.76)::text from generate_series(1, 768)), ',') || ']'),

  -- Emma Brown - Data Scientist
  ('Emma', 'Brown',
   '[' || array_to_string(array(select (0.25 + random() * 0.5)::text from generate_series(1, 768)), ',') || ']'),

  -- Frank Miller - Project Manager
  ('Frank', 'Miller',
   '[' || array_to_string(array(select (0.18 + random() * 0.64)::text from generate_series(1, 768)), ',') || ']'),

  -- Grace Taylor - Content Creator
  ('Grace', 'Taylor',
   '[' || array_to_string(array(select (0.16 + random() * 0.68)::text from generate_series(1, 768)), ',') || ']'),

  -- Henry Anderson - Professional Musician
  ('Henry', 'Anderson',
   '[' || array_to_string(array(select (0.14 + random() * 0.72)::text from generate_series(1, 768)), ',') || ']'),

  -- Ivy Thomas - Language Teacher
  ('Ivy', 'Thomas',
   '[' || array_to_string(array(select (0.13 + random() * 0.74)::text from generate_series(1, 768)), ',') || ']'),

  -- Jack White - Fitness Trainer
  ('Jack', 'White',
   '[' || array_to_string(array(select (0.11 + random() * 0.78)::text from generate_series(1, 768)), ',') || ']'),

  -- Kate Harris - Professional Chef
  ('Kate', 'Harris',
   '[' || array_to_string(array(select (0.17 + random() * 0.66)::text from generate_series(1, 768)), ',') || ']'),

  -- Leo Clark - Math Tutor & Data Analyst
  ('Leo', 'Clark',
   '[' || array_to_string(array(select (0.22 + random() * 0.56)::text from generate_series(1, 768)), ',') || ']'),

  -- Maya Lewis - Visual Artist
  ('Maya', 'Lewis',
   '[' || array_to_string(array(select (0.19 + random() * 0.62)::text from generate_series(1, 768)), ',') || ']'),

  -- Noah Walker - Professional Dancer
  ('Noah', 'Walker',
   '[' || array_to_string(array(select (0.15 + random() * 0.7)::text from generate_series(1, 768)), ',') || ']'),

  -- Olivia Hall - Business Analyst
  ('Olivia', 'Hall',
   '[' || array_to_string(array(select (0.21 + random() * 0.58)::text from generate_series(1, 768)), ',') || ']')

) AS profiles(first_name, last_name, embedding)
WHERE up.first_name = profiles.first_name AND up.last_name = profiles.last_name;

-- DEMO USER SEED DATA
-- Create a specific demo user for testing
INSERT INTO users (id, first_name, last_name, birthdate, gender, tz_name) VALUES
  ('6eae5c27-d8b1-4d99-81ca-4771da8a5f34', 'Demo', 'User', '1990-06-15', 'M', 'America/New_York')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  birthdate = EXCLUDED.birthdate,
  gender = EXCLUDED.gender,
  tz_name = EXCLUDED.tz_name;

