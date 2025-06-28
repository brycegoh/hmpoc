# Context

Tasked to build a P2P skill exchange platform. Its essentially tinder for skill sets.

# How to start
- Request for `.api.env` and `.workers.env`
- Place them at the root
- Run `docker-compose up --build`
- Visit `http://localhost:3001/`

NOTE: Since I am using the free tier of Supabase, they might pause the project after awhile. I will try my best to keep it running but just let me know if its paused.

# Technologies used (brief list)

Backend:
- Supabase
  - For PostgresDB
  - Built-in authentication and real-time functionalities
  - Free while we test for PMF

- Graphile workers
  - Durable queue for postgres

Frontend:
- React, tailwind

# Feature set to focus on

This section I will note down my thought process behind the features I decided to put thought into and build it.

## Caveat 

To be honest, in the context of a startup, a more MVP to test market demand would be a nice landing page with a waitlist (for example, probably can make it even more manual), not to build out the actual product. But, for the purposes of this task, let's think through it.

## What is important

TLDR, the most important and non-trivial portion is the matching algorithm. Everything else such as authentication, UI to view matches, UI for messaging or video call, etc are all not priority in terms of engineering as they are mostly *solved* problems, meaning there are existing off the shelf solutions for it and no much brain power has to be used for it (not as much as the matching algo at least)

The matching algorithm is also non-trivial because it is core to the product experience. If TikTok launched with a half baked matching algorithm, their retention would suffer. This is navbar bg-white shadow-lg to product and business standpoint.

# Matching Algorithm

So, I made the decision to build out the matching algorithm in which these are the requirements I set out for myself:

## Requirements

1. It cannot be some complex ML pipeline (its only a POC and I don't work for openai so I can't do this within a day LOL).
2. The baseline requirement is that both users must have skills they can exchange (bi-directional).
3. Whatever scoring we use must be dynamically added up and not some cached score, as the scoring algorithm will almost 100% change in the future. This also allows some A/B testing if we ever want to.
4. Will not use any graph databases due to lack of familiarity and time.
5. Must take into account some semantic information and not just matching skills.

## High level overview of what we can do

Given these requirements, we can split the matching algorithm into 2 segments: `Search` and `Rerank`. Since we always want users to have exchangeable skills, we can use that criteria to reduce the user pool that has to be rerank-ed.

### Search Segment

For search we can just make use of `user_skills` table and calculcate the amount of overlap. Its just an SQL query.

### Rerank Segment

This is where it gets interesting since we can determine what to use to create a score.

Given the requirements we set out, I decided to create a score using:
- **Mutual Skills (35%)** - Normalized overlap score from search phase (bidirectional skill compatibility)
  - The base requirement of exchangeable skills
- **Reliability (25%)** - Candidate's response rate based on 30-day swipe history (accepted + completed / offered)
  - Used as a proxy for how active and willing the user is to accept offers
- **Timezone Overlap (15%)** - Hours of overlap in waking hours between viewer and candidate timezones
  - Users with same timezone have a higher chance of actually meeting up
- **Age Affinity (10%)** - Learned preference based on viewer's historical accept rate per age gap bucket
  - Based on swipe history, if user has a preference for a certain age, this is used as a proxy
- **Gender Match (5%)** - Simple binary match (1 if same gender, 0 otherwise)
  - We assume that users prefer meeting up with users of same gender.
- **LinkedIn Embedding Similarity (10%)** - Semantic similarity between LinkedIn profiles using vector embeddings
  - This will be explained below.

#### LinkedIn Embedding

I set out to have a requirement of matching based on *semantic information*, this is usually done with some custom reccomendation ML engine which a startup cannot afford to waste time on especially without PMF. Therefore since we have RAG technology using LLMs, we can essentially make use of it to have some semantic measurement. 

Therefore, I made a pipeline that is split into 3 stages: `extraction` -> `summarisation` -> `vectorisation`. Since this involves external APIs and we would prefer this pipeline to be resistent to both internal and external server issues. For example, if some LLM api goes down after extraction then we lose it, so some persistence is needed. Therefore, I decided to add a queue and to make it simple without any trouble, we can just use postgres as the queue using `graphile workers`.

For our workflow, I used `apify` for extraction, `Google Gemini` for summarisation and `Google's text-embedding-004` for getting the vector.

# User journey built and roadmap

## What is done

- Basic auth with a onboarding form
- Getting matches and selecting "yes / no"

## Roadmap

In order of priority:
1. UI to show offers that the user got
2. Can we defer the arrangement of a meeting to another app? 
  - This needs to be discussed as the moment the user leaves the app, we lose user retention on our app after the match happens
  - If we want to not lose the user then in-app messaging system would be priority 2
3. Make the linkedin extraction part of the sign up flow
  - An existing issue is that the getting of embedding is in a race condition with the user completing the onboarding. 
  - Ideally we have some sort of minimum wait time but should not force the user to wait in case of any external service downtime or what not
  - With that, we can do best-effort in terms of pre-filling the onboarding form
  - This is also very powerful as we can summarise the user's characteristics and make that part of the onboarding flow as well
4. Improve UI design and test internally
5. Add some monitoring stuff
  - `Amplitude`, `Posthog`, `Clarity` or `Sentry` for frontend
  - If someone in the team is familiar and can quickly setup then backend can resort to `prometheus and grafana` 
    - If not, then just add some slack or telegram notification on error. Make use of the queue so we avoid rate limits etc.
5. Launch publicly
6. Once launch, we can expand the RAG flow to instagram or whatever so that we get more meaningful data on the user.


# Table structure

### `users`
- `id` (UUID, PK) - Unique user identifier
- `first_name`, `last_name` (TEXT) - User name components
- `birthdate` (DATE) - User's date of birth
- `gender` (CHAR(1)) - M/F/O gender options
- `tz_name` (TEXT) - Timezone (defaults to 'Asia/Singapore')
- `created_at`, `updated_at` (TIMESTAMPTZ) - Record timestamps

### `skills`
- `id` (UUID, PK) - Unique skill identifier  
- `name` (TEXT, UNIQUE) - Skill name (e.g., "Python", "Guitar", "Cooking")

### `user_skills`
- `id` (BIGSERIAL, PK) - Auto-increment primary key
- `user_id` (UUID, FK) - References users table
- `skill_id` (UUID, FK) - References skills table
- `role` (skill_role ENUM) - Either 'teach' or 'learn'
- `level` (TEXT) - Skill proficiency level
- Unique constraint on (user_id, skill_id, role)

### `swipe_history`
- `id` (BIGSERIAL, PK) - Auto-increment primary key
- `viewer_id` (UUID, FK) - User who initiated the swipe
- `candidate_id` (UUID, FK) - User who was swiped on
- `status` (match_status ENUM) - 'declined', 'offered', or 'accepted'
- `created_at` (TIMESTAMPTZ) - When the swipe occurred

### `linkedin_data`
- `id` (UUID, PK) - Unique record identifier
- `user_id` (UUID, FK) - References users table (one-to-one relationship)
- `linkedin_url` (TEXT) - LinkedIn profile URL
- `profile_data` (JSONB) - Raw LinkedIn profile data
- `profile_summary` (JSONB) - AI-generated profile summary
- `embedding` (vector(768)) - Vector embedding for similarity matching
- `state` (TEXT) - Processing state: 'in_queue', 'extracting', 'summarising', 'embedding', 'completed'
- `extraction_date`, `created_at`, `updated_at` (TIMESTAMPTZ) - Timestamps

## Key Functions

### `find_mutual_skill_candidates(viewer_id, limit)`
Returns potential matches where both users have complementary skills:
- Finds candidates who teach skills the viewer wants to learn
- Finds candidates who want to learn skills the viewer can teach
- Excludes users already swiped on in the last 7 days
- Returns overlap scores based on mutual skill compatibility

### `get_linkedin_embedding_similarities(viewer_id, candidate_ids[])`
Calculates LinkedIn profile similarity using vector embeddings:
- Uses cosine similarity between profile embeddings
- Normalizes scores to [0, 1] range
- Returns 0.5 (neutral) for users without LinkedIn data


