-- Safe migration to create user_invoices table without affecting existing data
-- This migration ONLY creates the missing table and does NOT modify existing tables

-- Create user_invoices table for storing invoice information
CREATE TABLE IF NOT EXISTS public.user_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    package_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_invoices_user_id ON public.user_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_stripe_invoice_id ON public.user_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_status ON public.user_invoices(status);
CREATE INDEX IF NOT EXISTS idx_user_invoices_created_at ON public.user_invoices(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invoices' AND policyname = 'Users can view their own invoices') THEN
        CREATE POLICY "Users can view their own invoices" ON public.user_invoices
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invoices' AND policyname = 'Users can insert their own invoices') THEN
        CREATE POLICY "Users can insert their own invoices" ON public.user_invoices
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invoices' AND policyname = 'Service role can manage all invoices') THEN
        CREATE POLICY "Service role can manage all invoices" ON public.user_invoices
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Grant permissions safely
GRANT ALL ON public.user_invoices TO service_role;
GRANT SELECT, INSERT ON public.user_invoices TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.user_invoices IS 'Stores invoice information for user purchases and credit packages';
