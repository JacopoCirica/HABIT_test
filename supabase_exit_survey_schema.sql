-- Exit Survey Table Schema for HABIT Platform
-- This table stores exit survey responses for ScotoBOT and Enron sessions

CREATE TABLE exit_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  room_id TEXT,
  session_type TEXT NOT NULL, -- 'scotobot', 'enron', etc.
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback TEXT,
  session_duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_exit_surveys_user_id ON exit_surveys(user_id);
CREATE INDEX idx_exit_surveys_session_type ON exit_surveys(session_type);
CREATE INDEX idx_exit_surveys_created_at ON exit_surveys(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE exit_surveys ENABLE ROW LEVEL SECURITY;

-- Create permissive policy to allow anonymous inserts and selects
CREATE POLICY "Allow anonymous access to exit_surveys" ON exit_surveys
FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated access to exit_surveys" ON exit_surveys
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exit_surveys_updated_at 
    BEFORE UPDATE ON exit_surveys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 