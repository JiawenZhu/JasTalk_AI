-- =====================================================
-- COMPLETE MIGRATION SCRIPT FOR SUPABASE PROJECT
-- =====================================================
-- Copy and paste this entire script into your TARGET Supabase SQL Editor
-- This will recreate your entire knowledge base system

-- =====================================================
-- STEP 1: ENABLE EXTENSIONS
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- STEP 2: CREATE CORE TABLES (MATCHING YOUR CURRENT SCHEMA)
-- =====================================================

-- Create agents table to store agent configurations
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    retell_agent_id VARCHAR(255) NOT NULL, -- The actual Retell AI agent ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    custom_instructions TEXT,
    voice_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_base_documents table with enhanced Gemini AI analysis
CREATE TABLE IF NOT EXISTS public.knowledge_base_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'pdf', 'txt', 'url', etc.
    file_size INTEGER,
    content TEXT NOT NULL, -- Extracted text content
    url TEXT, -- If uploaded from URL
    metadata JSONB DEFAULT '{}', -- Additional metadata
    
    -- Enhanced Gemini AI analysis columns
    analysis JSONB DEFAULT '{}',
    summary TEXT,
    key_topics TEXT[],
    entities TEXT[],
    categories TEXT[],
    sentiment VARCHAR(20) DEFAULT 'neutral',
    language VARCHAR(10) DEFAULT 'en',
    reading_level VARCHAR(20) DEFAULT 'intermediate',
    key_phrases TEXT[],
    answerable_questions TEXT[],
    processing_status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_chunks table for vector search with enhanced features
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.knowledge_base_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding VECTOR(1536), -- OpenAI ada-002 embedding dimension
    
    -- Enhanced chunk features
    summary TEXT,
    keywords TEXT[],
    importance INTEGER DEFAULT 5,
    searchable_content TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_knowledge_base junction table
CREATE TABLE IF NOT EXISTS public.agent_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.knowledge_base_documents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, document_id)
);

-- Create conversation_logs table for analytics
CREATE TABLE IF NOT EXISTS public.conversation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    retell_call_id VARCHAR(255),
    duration_seconds INTEGER,
    transcript JSONB,
    knowledge_base_used BOOLEAN DEFAULT false,
    relevant_chunks UUID[], -- Array of chunk IDs that were used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practice_sessions table (matching your current schema)
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT NOT NULL, -- Using TEXT as per your current schema
    interview_id UUID,
    session_name TEXT NOT NULL,
    status TEXT DEFAULT 'in-progress', -- Using TEXT instead of enum
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    score INTEGER,
    total_questions INTEGER DEFAULT 0,
    completed_questions INTEGER DEFAULT 0,
    agent_id TEXT,
    agent_name TEXT,
    call_id TEXT,
    retell_agent_id TEXT,
    retell_call_id TEXT,
    questions JSONB,
    metadata JSONB DEFAULT '{}'
);

-- Create user_subscriptions table (matching your current schema)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
    interview_time_remaining INTEGER NOT NULL DEFAULT 0,
    interview_time_total INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_invoices table (matching your current schema)
CREATE TABLE IF NOT EXISTS public.user_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT NOT NULL UNIQUE,
    package_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_retell_agent_id ON public.agents(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_user_id ON public.knowledge_base_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_agent_id ON public.knowledge_base_documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_base_agent_id ON public.agent_knowledge_base(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_id ON public.conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_agent_id ON public.conversation_logs(agent_id);

-- Practice sessions indexes (matching your current schema)
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON public.practice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON public.practice_sessions(created_at);

-- User subscriptions indexes (matching your current schema)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- User invoices indexes (matching your current schema)
CREATE INDEX IF NOT EXISTS idx_user_invoices_user_id ON public.user_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_stripe_invoice_id ON public.user_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_created_at ON public.user_invoices(created_at);

-- Enhanced knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_documents_categories ON public.knowledge_base_documents USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_documents_key_topics ON public.knowledge_base_documents USING GIN (key_topics);
CREATE INDEX IF NOT EXISTS idx_documents_entities ON public.knowledge_base_documents USING GIN (entities);
CREATE INDEX IF NOT EXISTS idx_documents_sentiment ON public.knowledge_base_documents(sentiment);
CREATE INDEX IF NOT EXISTS idx_documents_language ON public.knowledge_base_documents(language);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON public.knowledge_base_documents(processing_status);

-- Enhanced chunk indexes
CREATE INDEX IF NOT EXISTS idx_chunks_keywords ON public.document_chunks USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_chunks_importance ON public.document_chunks(importance);
CREATE INDEX IF NOT EXISTS idx_chunks_searchable_content ON public.document_chunks USING GIN (to_tsvector('english', searchable_content));

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON public.document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- Agents policies
CREATE POLICY "Users can view own agents" ON public.agents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agents" ON public.agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents" ON public.agents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents" ON public.agents
    FOR DELETE USING (auth.uid() = user_id);

-- Knowledge base documents policies
CREATE POLICY "Users can view own documents" ON public.knowledge_base_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.knowledge_base_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.knowledge_base_documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.knowledge_base_documents
    FOR DELETE USING (auth.uid() = user_id);

-- Document chunks policies (inherit from parent document)
CREATE POLICY "Users can view chunks of own documents" ON public.document_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.knowledge_base_documents 
            WHERE id = document_chunks.document_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chunks for own documents" ON public.document_chunks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.knowledge_base_documents 
            WHERE id = document_chunks.document_id 
            AND user_id = auth.uid()
        )
    );

-- Agent knowledge base junction policies
CREATE POLICY "Users can manage own agent knowledge base" ON public.agent_knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.agents 
            WHERE id = agent_knowledge_base.agent_id 
            AND user_id = auth.uid()
        )
    );

-- Conversation logs policies
CREATE POLICY "Users can view own conversation logs" ON public.conversation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation logs" ON public.conversation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Practice sessions policies (using user_id as TEXT)
CREATE POLICY "Users can view own practice sessions" ON public.practice_sessions
    FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert own practice sessions" ON public.practice_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update own practice sessions" ON public.practice_sessions
    FOR UPDATE USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete own practice sessions" ON public.practice_sessions
    FOR DELETE USING (user_id = auth.uid()::TEXT);

-- User subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- User invoices policies
CREATE POLICY "Users can view own invoices" ON public.user_invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON public.user_invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users policies
CREATE POLICY "Users can view own user data" ON public.users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user data" ON public.users
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: CREATE FUNCTIONS
-- =====================================================

-- Function for advanced document search
CREATE OR REPLACE FUNCTION search_knowledge_base(
    search_query TEXT,
    user_id_filter UUID DEFAULT NULL,
    agent_id_filter UUID DEFAULT NULL,
    categories_filter TEXT[] DEFAULT NULL,
    min_importance INTEGER DEFAULT 1,
    limit_results INTEGER DEFAULT 20
)
RETURNS TABLE (
    document_id UUID,
    chunk_id UUID,
    title TEXT,
    content TEXT,
    summary TEXT,
    importance INTEGER,
    categories TEXT[],
    key_topics TEXT[],
    rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kbd.id as document_id,
        dc.id as chunk_id,
        kbd.filename as title,
        dc.content,
        dc.summary,
        dc.importance,
        kbd.categories,
        kbd.key_topics,
        ts_rank(to_tsvector('english', dc.searchable_content), plainto_tsquery('english', search_query)) as rank
    FROM document_chunks dc
    JOIN knowledge_base_documents kbd ON dc.document_id = kbd.id
    WHERE 
        (user_id_filter IS NULL OR kbd.user_id = user_id_filter)
        AND (agent_id_filter IS NULL OR kbd.agent_id = agent_id_filter)
        AND (categories_filter IS NULL OR kbd.categories && categories_filter)
        AND dc.importance >= min_importance
        AND (
            to_tsvector('english', dc.searchable_content) @@ plainto_tsquery('english', search_query)
            OR kbd.key_topics && string_to_array(search_query, ' ')
            OR kbd.entities && string_to_array(search_query, ' ')
        )
    ORDER BY rank DESC, dc.importance DESC
    LIMIT limit_results;
END;
$$;

-- Function to get document statistics
CREATE OR REPLACE FUNCTION get_knowledge_base_stats(user_id_param UUID)
RETURNS TABLE (
    total_documents BIGINT,
    total_chunks BIGINT,
    categories TEXT[],
    languages TEXT[],
    avg_importance NUMERIC,
    processing_pending BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT kbd.id) as total_documents,
        COUNT(dc.id) as total_chunks,
        array_agg(DISTINCT unnest(kbd.categories)) FILTER (WHERE kbd.categories IS NOT NULL) as categories,
        array_agg(DISTINCT kbd.language) FILTER (WHERE kbd.language IS NOT NULL) as languages,
        AVG(dc.importance) as avg_importance,
        COUNT(DISTINCT kbd.id) FILTER (WHERE kbd.processing_status = 'pending') as processing_pending
    FROM knowledge_base_documents kbd
    LEFT JOIN document_chunks dc ON kbd.id = dc.document_id
    WHERE kbd.user_id = user_id_param;
END;
$$;

-- Function to find similar documents
CREATE OR REPLACE FUNCTION find_similar_documents(
    document_id_param UUID,
    similarity_threshold FLOAT DEFAULT 0.3,
    limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    similar_document_id UUID,
    filename TEXT,
    similarity_score FLOAT,
    shared_topics TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    source_topics TEXT[];
    source_categories TEXT[];
BEGIN
    -- Get topics and categories from source document
    SELECT key_topics, categories INTO source_topics, source_categories
    FROM knowledge_base_documents 
    WHERE id = document_id_param;
    
    RETURN QUERY
    SELECT 
        kbd.id as similar_document_id,
        kbd.filename,
        (
            CASE 
                WHEN source_topics IS NULL OR kbd.key_topics IS NULL THEN 0.0
                ELSE (
                    array_length(source_topics & kbd.key_topics, 1)::FLOAT / 
                    GREATEST(array_length(source_topics, 1), array_length(kbd.key_topics, 1))::FLOAT
                )
            END +
            CASE 
                WHEN source_categories IS NULL OR kbd.categories IS NULL THEN 0.0
                ELSE (
                    array_length(source_categories & kbd.categories, 1)::FLOAT / 
                    GREATEST(array_length(source_categories, 1), array_length(kbd.categories, 1))::FLOAT
                )
            END
        ) / 2.0 as similarity_score,
        source_topics & kbd.key_topics as shared_topics
    FROM knowledge_base_documents kbd
    WHERE 
        kbd.id != document_id_param
        AND kbd.user_id = (SELECT user_id FROM knowledge_base_documents WHERE id = document_id_param)
        AND (
            (source_topics IS NOT NULL AND kbd.key_topics IS NOT NULL AND source_topics && kbd.key_topics)
            OR (source_categories IS NOT NULL AND kbd.categories IS NOT NULL AND source_categories && kbd.categories)
        )
    HAVING (
        CASE 
            WHEN source_topics IS NULL OR kbd.key_topics IS NULL THEN 0.0
            ELSE (
                array_length(source_topics & kbd.key_topics, 1)::FLOAT / 
                GREATEST(array_length(source_topics, 1), array_length(kbd.key_topics, 1))::FLOAT
            )
        END +
        CASE 
            WHEN source_categories IS NULL OR kbd.categories IS NULL THEN 0.0
            ELSE (
                array_length(source_categories & kbd.categories, 1)::FLOAT / 
                GREATEST(array_length(source_categories, 1), array_length(kbd.categories, 1))::FLOAT
            )
        END
    ) / 2.0 >= similarity_threshold
    ORDER BY similarity_score DESC
    LIMIT limit_results;
END;
$$;

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.78,
    match_count INT DEFAULT 10,
    filter_agent_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    JOIN knowledge_base_documents kbd ON dc.document_id = kbd.id
    WHERE 
        (filter_agent_id IS NULL OR kbd.agent_id = filter_agent_id)
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
        AND kbd.user_id = auth.uid()
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- STEP 7: CREATE TRIGGERS
-- =====================================================

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_documents_updated_at ON public.knowledge_base_documents;
CREATE TRIGGER update_knowledge_base_documents_updated_at BEFORE UPDATE ON public.knowledge_base_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_invoices_updated_at ON public.user_invoices;
CREATE TRIGGER update_user_invoices_updated_at BEFORE UPDATE ON public.user_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 8: SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Complete migration successful! Your knowledge base system is ready.' as message;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- Your entire schema has been recreated in the target project
-- All tables, functions, triggers, policies, and indexes are now available
-- You can now update your .env.local with the new project credentials
