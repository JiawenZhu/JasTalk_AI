-- =====================================================
-- MANUAL KNOWLEDGE BASE TABLES CREATION
-- =====================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- This will create the missing knowledge base system tables

-- =====================================================
-- STEP 1: ENABLE EXTENSIONS
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- STEP 2: CREATE MISSING KNOWLEDGE BASE TABLES
-- =====================================================

-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    retell_agent_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    custom_instructions TEXT,
    voice_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_base_documents table
CREATE TABLE IF NOT EXISTS public.knowledge_base_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    content TEXT NOT NULL,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    
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

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.knowledge_base_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding VECTOR(1536),
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

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_retell_agent_id ON public.agents(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_user_id ON public.knowledge_base_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_agent_id ON public.knowledge_base_documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_base_agent_id ON public.agent_knowledge_base(agent_id);

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
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_knowledge_base ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_documents_updated_at ON public.knowledge_base_documents;
CREATE TRIGGER update_knowledge_base_documents_updated_at BEFORE UPDATE ON public.knowledge_base_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Knowledge base tables created successfully!' as message;
SELECT 'Your schema now includes:' as info;
SELECT '• agents' as table_name;
SELECT '• knowledge_base_documents' as table_name;
SELECT '• document_chunks' as table_name;
SELECT '• agent_knowledge_base' as table_name;
