-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for plan
CREATE TYPE plan AS ENUM ('free', 'pro', 'free_trial_over');

-- Create enum type for difficulty levels
CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');

-- Create enum type for programming languages
CREATE TYPE programming_language AS ENUM ('javascript', 'python', 'java', 'typescript', 'cpp', 'csharp', 'go', 'rust');

-- Create tables
CREATE TABLE organization (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    name TEXT,
    image_url TEXT,
    allowed_responses_count INTEGER DEFAULT 10,
    plan plan DEFAULT 'free'
);

CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    email TEXT,
    organization_id TEXT REFERENCES organization(id)
);

CREATE TABLE interviewer (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    agent_id TEXT UNIQUE, -- Add UNIQUE constraint to prevent duplicates
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    audio TEXT,
    empathy INTEGER NOT NULL,
    exploration INTEGER NOT NULL,
    rapport INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()), -- Track last sync
    sync_status TEXT DEFAULT 'active' -- 'active', 'orphaned', 'deleted'
);

-- Coding Questions Pool Table
CREATE TABLE coding_question (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty difficulty_level NOT NULL,
    tags TEXT[] DEFAULT '{}',
    constraints TEXT[] DEFAULT '{}',
    examples JSONB DEFAULT '[]',
    test_cases JSONB DEFAULT '[]',
    hints TEXT[] DEFAULT '{}',
    time_limit INTEGER DEFAULT 30, -- in minutes
    memory_limit INTEGER DEFAULT 128, -- in MB
    company_origin TEXT, -- e.g., "Google", "Meta", "Amazon"
    topic TEXT, -- e.g., "Arrays", "Trees", "Dynamic Programming"
    is_active BOOLEAN DEFAULT true,
    solution_template JSONB DEFAULT '{}' -- templates for different languages
);

-- Interview Coding Questions (many-to-many relationship)
CREATE TABLE interview_coding_question (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id TEXT REFERENCES interview(id) ON DELETE CASCADE,
    coding_question_id TEXT REFERENCES coding_question(id),
    question_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

-- Coding Submissions Table
CREATE TABLE coding_submission (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    response_id INTEGER REFERENCES response(id),
    coding_question_id TEXT REFERENCES coding_question(id),
    language programming_language NOT NULL,
    code TEXT NOT NULL,
    submission_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    test_results JSONB DEFAULT '{}',
    ai_feedback JSONB DEFAULT '{}',
    score INTEGER DEFAULT 0, -- 0-100
    execution_time INTEGER, -- in milliseconds
    memory_used INTEGER, -- in MB
    is_final_submission BOOLEAN DEFAULT false
);

CREATE TABLE interview (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    name TEXT,
    description TEXT,
    objective TEXT,
    organization_id TEXT REFERENCES organization(id),
    user_id TEXT REFERENCES "user"(id),
    interviewer_id INTEGER REFERENCES interviewer(id),
    is_active BOOLEAN DEFAULT true,
    is_anonymous BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    logo_url TEXT,
    theme_color TEXT,
    url TEXT,
    readable_slug TEXT,
    questions JSONB,
    quotes JSONB[],
    insights TEXT[],
    respondents TEXT[],
    question_count INTEGER,
    response_count INTEGER,
    time_duration TEXT,
    has_coding_questions BOOLEAN DEFAULT false, -- NEW: indicates if interview includes coding
    coding_question_count INTEGER DEFAULT 0 -- NEW: number of coding questions
);

CREATE TABLE response (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id TEXT REFERENCES interview(id),
    name TEXT,
    email TEXT,
    call_id TEXT,
    candidate_status TEXT,
    duration INTEGER,
    details JSONB,
    analytics JSONB,
    is_analysed BOOLEAN DEFAULT false,
    is_ended BOOLEAN DEFAULT false,
    is_viewed BOOLEAN DEFAULT false,
    tab_switch_count INTEGER,
    coding_session_data JSONB DEFAULT '{}' -- NEW: stores coding session information
);

CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id TEXT REFERENCES interview(id),
    email TEXT,
    feedback TEXT,
    satisfaction INTEGER
);

-- Add indexes for better performance
CREATE INDEX idx_coding_question_difficulty ON coding_question(difficulty);
CREATE INDEX idx_coding_question_topic ON coding_question(topic);
CREATE INDEX idx_coding_question_company ON coding_question(company_origin);
CREATE INDEX idx_interview_coding_question_interview_id ON interview_coding_question(interview_id);
CREATE INDEX idx_coding_submission_response_id ON coding_submission(response_id);
CREATE INDEX idx_interview_has_coding ON interview(has_coding_questions);

-- Enable RLS but with proper policies
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview ENABLE ROW LEVEL SECURITY;
ALTER TABLE response ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewer ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_coding_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_submission ENABLE ROW LEVEL SECURITY;

-- User policies - allow authenticated users to manage their own data
CREATE POLICY "Users can manage own data" ON "user"
    FOR ALL USING (auth.uid()::text = id);

-- Organization policies - allow authenticated users to create and manage organizations
CREATE POLICY "Authenticated users can create organizations" ON organization
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view organizations they belong to" ON organization
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id FROM "user" WHERE organization_id = organization.id
        )
    );

CREATE POLICY "Users can update their organization" ON organization
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT id FROM "user" WHERE organization_id = organization.id
        )
    );

-- Interview policies
CREATE POLICY "Users can manage interviews in their organization" ON interview
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM "user" WHERE id = auth.uid()::text
        )
    );

-- Response policies - allow public access for interview responses
CREATE POLICY "Public can create responses" ON response
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view responses for their interviews" ON response
    FOR SELECT USING (
        interview_id IN (
            SELECT id FROM interview WHERE organization_id IN (
                SELECT organization_id FROM "user" WHERE id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can update responses for their interviews" ON response
    FOR UPDATE USING (
        interview_id IN (
            SELECT id FROM interview WHERE organization_id IN (
                SELECT organization_id FROM "user" WHERE id = auth.uid()::text
            )
        )
    );

-- Interviewer policies - allow users to create and manage interviewers
CREATE POLICY "Authenticated users can manage interviewers" ON interviewer
    FOR ALL USING (auth.role() = 'authenticated');

-- Coding Question policies - allow authenticated users to view coding questions
CREATE POLICY "Authenticated users can view coding questions" ON coding_question
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create coding questions" ON coding_question
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Interview Coding Question policies
CREATE POLICY "Users can manage interview coding questions for their interviews" ON interview_coding_question
    FOR ALL USING (
        interview_id IN (
            SELECT id FROM interview WHERE organization_id IN (
                SELECT organization_id FROM "user" WHERE id = auth.uid()::text
            )
        )
    );

-- Coding Submission policies - allow public submission but restricted viewing
CREATE POLICY "Public can create coding submissions" ON coding_submission
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view coding submissions for their interviews" ON coding_submission
    FOR SELECT USING (
        response_id IN (
            SELECT id FROM response WHERE interview_id IN (
                SELECT id FROM interview WHERE organization_id IN (
                    SELECT organization_id FROM "user" WHERE id = auth.uid()::text
                )
            )
        )
    );
