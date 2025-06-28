-- USERS
CREATE TABLE users (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name  TEXT,
    birthdate  DATE,
    gender     CHAR(1)      CHECK (gender IN ('M','F','O')),
    tz_name    TEXT         DEFAULT 'Asia/Singapore',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SKILLS
CREATE TABLE skills (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

-- USER_SKILLS
CREATE TYPE skill_role AS ENUM ('teach','learn');

CREATE TABLE user_skills (
    id       BIGSERIAL PRIMARY KEY,
    user_id  UUID REFERENCES users(id),
    skill_id UUID REFERENCES skills(id),
    role     skill_role NOT NULL,
    level    TEXT,
    UNIQUE (user_id, skill_id, role)
);
CREATE INDEX ux_skill_role ON user_skills (skill_id, role, user_id);

-- SWIPE_HISTORY
CREATE TYPE match_status AS ENUM ('declined', 'offered', 'accepted');

CREATE TABLE swipe_history (
    id            BIGSERIAL PRIMARY KEY,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    viewer_id     UUID REFERENCES users(id),
    candidate_id  UUID REFERENCES users(id),
    status        match_status NOT NULL
);
CREATE INDEX ie_sh_viewer ON swipe_history (viewer_id, created_at DESC);
CREATE INDEX ie_sh_cand   ON swipe_history (candidate_id, created_at DESC);

-- WEIGHTS
CREATE TABLE sys_match_weights (
    key   TEXT PRIMARY KEY,
    value NUMERIC NOT NULL
);
