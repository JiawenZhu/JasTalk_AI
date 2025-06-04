-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for plan
CREATE TYPE plan AS ENUM ('free', 'pro', 'free_trial_over');

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
    agent_id TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    audio TEXT,
    empathy INTEGER NOT NULL,
    exploration INTEGER NOT NULL,
    rapport INTEGER NOT NULL,
    speed INTEGER NOT NULL
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
    time_duration TEXT
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
    tab_switch_count INTEGER
);

CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id TEXT REFERENCES interview(id),
    email TEXT,
    feedback TEXT,
    satisfaction INTEGER
);

-- Enable RLS but with proper policies
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview ENABLE ROW LEVEL SECURITY;
ALTER TABLE response ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewer ENABLE ROW LEVEL SECURITY;

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
