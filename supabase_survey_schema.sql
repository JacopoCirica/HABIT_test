-- Create survey_responses table for storing post-chat survey data
CREATE TABLE survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Session metadata
  room_id VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,
  room_type VARCHAR(50), -- '1v1', '2v1', '2vs4', 'team-vs-team', etc.
  session_duration INTEGER NOT NULL, -- in seconds
  
  -- Survey responses (Likert scale questions 1-5)
  clarity VARCHAR(10) NOT NULL, -- How clear were responses
  naturalness VARCHAR(10) NOT NULL, -- How natural was conversation  
  difficulty VARCHAR(10) NOT NULL, -- How difficult to express viewpoints
  engagement VARCHAR(10) NOT NULL, -- How engaging was conversation
  
  -- AI detection
  suspected_ai VARCHAR(20) NOT NULL, -- 'yes', 'no', 'unsure'
  ai_suspicion_reason TEXT, -- Why they suspected AI (optional)
  
  -- Overall experience
  overall_experience VARCHAR(10) NOT NULL, -- Overall rating 1-5
  improvements TEXT, -- Suggested improvements (optional)
  would_participate_again VARCHAR(20) NOT NULL, -- 'definitely', 'probably', etc.
  additional_comments TEXT, -- Additional feedback (optional)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_survey_responses_room_id ON survey_responses(room_id);
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_room_type ON survey_responses(room_type);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts for authenticated users
CREATE POLICY "Allow survey responses insert" ON survey_responses
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow reading survey responses for authenticated users
CREATE POLICY "Allow survey responses select" ON survey_responses
  FOR SELECT 
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_survey_responses_updated_at
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE survey_responses IS 'Stores post-chat survey responses from all room types';
COMMENT ON COLUMN survey_responses.room_id IS 'Associated room ID (can be null for some room types)';
COMMENT ON COLUMN survey_responses.session_duration IS 'Session duration in seconds';
COMMENT ON COLUMN survey_responses.suspected_ai IS 'Whether user suspected AI involvement';
COMMENT ON COLUMN survey_responses.would_participate_again IS 'User willingness to participate again'; 