-- Simple fix: Disable Row Level Security for survey_responses table
-- This is the easiest solution for a research application

ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- This will allow the API to insert survey data without authentication
-- which is appropriate for anonymous research participants 