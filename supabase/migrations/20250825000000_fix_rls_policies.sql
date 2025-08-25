-- Fix RLS policies for conversation_logs table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own conversation logs" ON "public"."conversation_logs";
DROP POLICY IF EXISTS "Users can update their own conversation logs" ON "public"."conversation_logs";
DROP POLICY IF EXISTS "Users can view their own conversation logs" ON "public"."conversation_logs";

-- Create new policies with proper JWT authentication
CREATE POLICY "Users can insert their own conversation logs"
ON "public"."conversation_logs"
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK ((candidate_name = current_setting('request.jwt.claim.email'::text, true)));

CREATE POLICY "Users can update their own conversation logs"
ON "public"."conversation_logs"
AS PERMISSIVE
FOR UPDATE
TO public
USING ((candidate_name = current_setting('request.jwt.claim.email'::text, true)));

CREATE POLICY "Users can view their own conversation logs"
ON "public"."conversation_logs"
AS PERMISSIVE
FOR SELECT
TO public
USING (((candidate_name = current_setting('request.jwt.claim.email'::text, true)) AND (current_setting('request.jwt.claim.email'::text, true) IS NOT NULL)));

-- Ensure RLS is enabled and forced
ALTER TABLE "public"."conversation_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_logs" FORCE ROW LEVEL SECURITY;
