-- Create user_invoices table for tracking purchases and invoices
CREATE TABLE IF NOT EXISTS user_invoices (
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

-- Create RLS policies
ALTER TABLE user_invoices ENABLE ROW LEVEL SECURITY;

-- Users can only see their own invoices
CREATE POLICY IF NOT EXISTS "Users can view own invoices" ON user_invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own invoices (for webhook)
CREATE POLICY IF NOT EXISTS "Users can insert own invoices" ON user_invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_invoices_user_id ON user_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_stripe_invoice_id ON user_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_created_at ON user_invoices(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_invoices_updated_at 
    BEFORE UPDATE ON user_invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
