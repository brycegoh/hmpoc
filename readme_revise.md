# P2P Skill Exchange Platform (Like Tinder but for skills)

## Overview

This project implements a peer-to-peer skill exchange platform that connects users based on complementary skills they can teach and learn. The platform uses an intelligent matching algorithm combining traditional filtering with semantic analysis to create meaningful connections between learners and teachers.

## Quick Start

### Prerequisites
- Request `.api.env` and `.workers.env` configuration files
- Place them in the project root directory

### Running the Application
```bash
docker-compose up --build
```
Access the application at `http://localhost:3001/`

> **Note:** This project uses Supabase's free tier, which may pause after periods of inactivity. Please notify us if you encounter connection issues.

## Technology Stack

### Backend
- **Supabase**: PostgreSQL database with built-in authentication and real-time capabilities
- **Graphile Workers**: Durable job queue system using PostgreSQL
- **Node.js/TypeScript**: API server implementation

### Frontend
- **React**: User interface framework
- **Tailwind CSS**: Styling and responsive design

### External Services
- **Apify**: LinkedIn profile data extraction
- **Google Gemini**: Profile summarization
- **Google Text-Embedding-004**: Vector embeddings for semantic matching

## Product Strategy & Feature Prioritization

### MVP Philosophy

While a traditional MVP for market validation might focus on a landing page with waitlist functionality, this POC demonstrates the core technical challenges and product experience of a skill exchange platform.

### Core Focus: Matching

The matching algorithm represents the most critical and technically challenging component of the platform. Unlike standard features such as authentication, messaging, or video calls (which have established solutions), the matching algorithm directly impacts:

- **User Retention**: Poor matches lead to user churn
- **Product Differentiation**: Unique matching capabilities create competitive advantage
- **Technical Complexity**: Requires custom logic combining multiple data sources and ranking factors

## Matching Algorithm Architecture

### Design Requirements

1. **Simplicity**: Avoid complex ML pipelines unsuitable for POC timeframes
2. **Bidirectional Compatibility**: Ensure mutual skill exchange potential
3. **Dynamic Scoring**: Real-time score calculation enabling A/B testing and algorithm iteration
4. **Standard Infrastructure**: Use familiar technologies (PostgreSQL) rather than specialized graph databases
5. **Semantic Understanding**: Incorporate meaning beyond exact skill name matches

### Two-Phase Approach: Search + Rerank

#### Phase 1: Search (Candidate Filtering)
- **Objective**: Identify users with mutual skill exchange potential
- **Implementation**: SQL-based queries on `user_skills` table
- **Criteria**: Bidirectional skill compatibility (A teaches what B wants to learn, B teaches what A wants to learn)

#### Phase 2: Rerank (Quality Scoring)
Advanced scoring system combining multiple factors:

| Factor | Weight | Description | Business Logic |
|--------|--------|-------------|----------------|
| **Mutual Skills** | 35% | Normalized bidirectional skill overlap | Core requirement for platform value |
| **Reliability** | 25% | 30-day response rate (accepted + completed / offered) | Proxy for user engagement and follow-through |
| **Timezone Overlap** | 15% | Waking hours intersection between users | Practical scheduling compatibility |
| **Age Affinity** | 10% | Learned preference from swipe history | Personalized matching based on user behavior |
| **Gender Match** | 5% | Binary same-gender preference | Social comfort factor |
| **LinkedIn Similarity** | 10% | Semantic profile similarity via embeddings | Professional and interest alignment |

### Semantic Matching via LinkedIn Embeddings

#### Challenge
Traditional recommendation systems require extensive ML infrastructure and training data. For early-stage products, this represents significant technical overhead without proven product-market fit.

#### Solution: RAG-Powered Semantic Analysis
Three-stage pipeline with fault tolerance:

1. **Extraction**: Apify scrapes LinkedIn profile data
2. **Summarization**: Google Gemini generates structured summaries
3. **Vectorization**: Google Text-Embedding-004 creates searchable embeddings

**Resilience Design**: Each stage persists data to PostgreSQL via Graphile Workers queue, ensuring recovery from external API failures.

## Current Implementation Status

### ✅ Completed Features
- **Authentication System**: User registration and login
- **Onboarding Flow**: Skill input and profile creation
- **Matching Interface**: Swipe-based match selection
- **Core Algorithm**: Bidirectional skill matching with scoring

### 🚧 Development Roadmap

#### Phase 1: Core User Experience
1. **Offer Management UI**: Interface for users to view and respond to incoming match requests
2. **Meeting Coordination**: 
   - **Option A**: Integrate third-party scheduling (risk: user retention loss)
   - **Option B**: In-app messaging system (recommended for retention)

#### Phase 2: Enhanced Onboarding
3. **LinkedIn Integration**: 
   - Incorporate profile extraction into signup flow
   - Pre-populate user skills and characteristics
   - Handle async processing with graceful fallbacks

#### Phase 3: Production Readiness
4. **UI/UX Polish**: Enhanced design and internal testing
5. **Monitoring & Analytics**:
   - **Frontend**: Amplitude, PostHog, or Microsoft Clarity
   - **Backend**: Prometheus/Grafana or Slack/Telegram alerts
6. **Public Launch!!!!!**: Beta release with user acquisition

#### Phase 4: Platform Expansion
7. **Multi-Platform RAG**: Extend semantic analysis to Instagram and other social platforms

## Database Schema

### Core Tables

#### `users`
```sql
- id (UUID, PK)              -- Unique identifier
- first_name, last_name      -- User identity
- birthdate (DATE)           -- Age calculation
- gender (CHAR(1))           -- M/F/O options
- tz_name (TEXT)             -- Timezone (default: 'Asia/Singapore')
- created_at, updated_at     -- Audit timestamps
```

#### `skills`
```sql
- id (UUID, PK)              -- Unique identifier
- name (TEXT, UNIQUE)        -- Skill name (e.g., "Python", "Guitar")
```

#### `user_skills`
```sql
- user_id (UUID, FK)         -- References users
- skill_id (UUID, FK)        -- References skills
- role (ENUM)                -- 'teach' | 'learn'
- level (TEXT)               -- Proficiency level
- UNIQUE(user_id, skill_id, role)
```

#### `swipe_history`
```sql
- viewer_id (UUID, FK)       -- User initiating swipe
- candidate_id (UUID, FK)    -- Target user
- status (ENUM)              -- 'declined' | 'offered' | 'accepted'
- created_at                 -- Interaction timestamp
```

#### `linkedin_data`
```sql
- user_id (UUID, FK)         -- One-to-one with users
- linkedin_url (TEXT)        -- Profile URL
- profile_data (JSONB)       -- Raw scraped data
- profile_summary (JSONB)    -- AI-generated summary
- embedding (vector(768))    -- Semantic embeddings
- state (TEXT)               -- Processing status
```

### Key Database Functions

#### `find_mutual_skill_candidates(viewer_id, limit)`
**Purpose**: Primary search function for compatible users
**Logic**:
- Identifies bidirectional skill compatibility
- Excludes recent swipe history (7-day window)
- Returns overlap scores for reranking

#### `get_linkedin_embedding_similarities(viewer_id, candidate_ids[])`
**Purpose**: Semantic similarity calculation
**Implementation**:
- Cosine similarity between profile embeddings
- Normalized scores [0, 1]
- Defaults to 0.5 for missing data

## Technical Architecture Benefits

1. **Scalability**: PostgreSQL-based design supports horizontal scaling
2. **Flexibility**: Dynamic scoring enables rapid algorithm iteration
3. **Reliability**: Queue-based processing handles external service dependencies
4. **Cost Efficiency**: Leverages existing cloud services rather than custom ML infrastructure
5. **Maintainability**: Standard web technologies with clear separation of concerns


