-- =====================================================
-- FIX EXISTING TABLES AND ADD MISSING COLUMNS
-- =====================================================
-- This migration safely adds missing columns and creates new tables
-- without conflicting with existing schema

-- =====================================================
-- STEP 1: ENABLE EXTENSIONS (SAFELY)
-- =====================================================

-- Enable necessary extensions if they exist
DO $$ 
BEGIN
    -- Check if vector extension exists and enable it
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
        CREATE EXTENSION IF NOT EXISTS "vector";
    END IF;
    
    -- Enable uuid-ossp if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
END $$;

-- =====================================================
-- STEP 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to conversation_logs if they don't exist
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversation_logs' AND column_name = 'user_id') THEN
        ALTER TABLE public.conversation_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add agent_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversation_logs' AND column_name = 'agent_id') THEN
        ALTER TABLE public.conversation_logs ADD COLUMN agent_id UUID;
    END IF;
    
    -- Add knowledge_base_used column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversation_logs' AND column_name = 'knowledge_base_used') THEN
        ALTER TABLE public.conversation_logs ADD COLUMN knowledge_base_used BOOLEAN DEFAULT false;
    END IF;
    
    -- Add relevant_chunks column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversation_logs' AND column_name = 'relevant_chunks') THEN
        ALTER TABLE public.conversation_logs ADD COLUMN relevant_chunks UUID[];
    END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE NEW TABLES THAT DON'T EXIST
-- =====================================================

-- Create agents table if it doesn't exist
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

-- Create knowledge_base_documents table if it doesn't exist
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

-- Create document_chunks table if it doesn't exist (with conditional vector support)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_chunks') THEN
        -- Check if vector extension is available
        IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
            -- Create with vector support
            EXECUTE 'CREATE TABLE public.document_chunks (
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
            )';
        ELSE
            -- Create without vector support
            EXECUTE 'CREATE TABLE public.document_chunks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                document_id UUID REFERENCES public.knowledge_base_documents(id) ON DELETE CASCADE,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                token_count INTEGER,
                summary TEXT,
                keywords TEXT[],
                importance INTEGER DEFAULT 5,
                searchable_content TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )';
        END IF;
    END IF;
END $$;

-- Create agent_knowledge_base junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.knowledge_base_documents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, document_id)
);

-- =====================================================
-- STEP 4: CREATE INDEXES (SAFELY)
-- =====================================================

-- Create indexes only if they don't exist
DO $$ 
BEGIN
    -- Agents indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agents_user_id') THEN
        CREATE INDEX idx_agents_user_id ON public.agents(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agents_retell_agent_id') THEN
        CREATE INDEX idx_agents_retell_agent_id ON public.agents(retell_agent_id);
    END IF;
    
    -- Knowledge base documents indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_base_documents_user_id') THEN
        CREATE INDEX idx_knowledge_base_documents_user_id ON public.knowledge_base_documents(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_base_documents_agent_id') THEN
        CREATE INDEX idx_knowledge_base_documents_agent_id ON public.knowledge_base_documents(agent_id);
    END IF;
    
    -- Document chunks indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_document_chunks_document_id') THEN
        CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);
    END IF;
    
    -- Agent knowledge base indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agent_knowledge_base_agent_id') THEN
        CREATE INDEX idx_agent_knowledge_base_agent_id ON public.agent_knowledge_base(agent_id);
    END IF;
    
    -- Conversation logs indexes (only if user_id column exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'conversation_logs' AND column_name = 'user_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversation_logs_user_id') THEN
            CREATE INDEX idx_conversation_logs_user_id ON public.conversation_logs(user_id);
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'conversation_logs' AND column_name = 'agent_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversation_logs_agent_id') THEN
            CREATE INDEX idx_conversation_logs_agent_id ON public.conversation_logs(agent_id);
        END IF;
    END IF;
END $$;

-- =====================================================
-- STEP 5: ENABLE RLS (SAFELY)
-- =====================================================

-- Enable RLS on tables that don't have it enabled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agents' AND rowsecurity = true) THEN
        ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'knowledge_base_documents' AND rowsecurity = true) THEN
        ALTER TABLE public.knowledge_base_documents ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_chunks' AND rowsecurity = true) THEN
        ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_knowledge_base' AND rowsecurity = true) THEN
        ALTER TABLE public.agent_knowledge_base ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES (SAFELY)
-- =====================================================

-- Create policies only if they don't exist
DO $$ 
BEGIN
    -- Agents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can view own agents') THEN
        CREATE POLICY "Users can view own agents" ON public.agents
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can insert own agents') THEN
        CREATE POLICY "Users can insert own agents" ON public.agents
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can update own agents') THEN
        CREATE POLICY "Users can update own agents" ON public.agents
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can delete own agents') THEN
        CREATE POLICY "Users can delete own agents" ON public.agents
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    -- Knowledge base documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_base_documents' AND policyname = 'Users can view own documents') THEN
        CREATE POLICY "Users can view own documents" ON public.knowledge_base_documents
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_base_documents' AND policyname = 'Users can insert own documents') THEN
        CREATE POLICY "Users can insert own documents" ON public.knowledge_base_documents
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_base_documents' AND policyname = 'Users can update own documents') THEN
        CREATE POLICY "Users can update own documents" ON public.knowledge_base_documents
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_base_documents' AND policyname = 'Users can delete own documents') THEN
        CREATE POLICY "Users can delete own documents" ON public.knowledge_base_documents
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Existing tables fixed and new tables created successfully!' as message;
