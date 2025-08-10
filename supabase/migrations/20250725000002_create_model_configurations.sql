-- Create model_configurations table
CREATE TABLE IF NOT EXISTS public.model_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE public.model_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own model configurations
CREATE POLICY "Users can view own model configurations" ON public.model_configurations
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own model configurations
CREATE POLICY "Users can insert own model configurations" ON public.model_configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own model configurations
CREATE POLICY "Users can update own model configurations" ON public.model_configurations
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own model configurations
CREATE POLICY "Users can delete own model configurations" ON public.model_configurations
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_model_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_model_configurations_updated_at
    BEFORE UPDATE ON public.model_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_model_configurations_updated_at();

-- Create function to create table if it doesn't exist (for API fallback)
CREATE OR REPLACE FUNCTION create_model_configurations_table()
RETURNS void AS $$
BEGIN
    -- This function is called by the API if the table doesn't exist
    -- The table creation is handled by the migration
    RETURN;
END;
$$ LANGUAGE plpgsql; 
