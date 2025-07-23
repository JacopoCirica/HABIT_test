-- Fix RLS policies for survey_responses table to allow anonymous access
-- This is needed because the app uses anon key, not authenticated users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow survey responses insert" ON survey_responses;
DROP POLICY IF EXISTS "Allow survey responses select" ON survey_responses;

-- Create new policies that allow anonymous access
-- This is appropriate for a research app where users aren't required to sign up

-- Allow anonymous users to insert survey responses
CREATE POLICY "Allow anonymous survey insert" ON survey_responses
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read survey responses (if needed for admin/research purposes)
CREATE POLICY "Allow anonymous survey select" ON survey_responses
  FOR SELECT 
  USING (true);

-- Alternatively, if you want to disable RLS entirely for this table:
-- ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- Note: The above policies allow any anonymous user to insert/read survey data.
-- This is appropriate for research applications but consider your security requirements. 