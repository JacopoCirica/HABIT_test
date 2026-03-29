-- ============================================
-- HABIT Platform - Complete Supabase Setup
-- Run this entire script in the Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. user_data table
-- ============================================
CREATE TABLE user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  sex VARCHAR(20) NOT NULL,
  education VARCHAR(50) NOT NULL,
  occupation VARCHAR(255) NOT NULL,
  vaccination INTEGER NOT NULL CHECK (vaccination >= 1 AND vaccination <= 7),
  climate_change INTEGER NOT NULL CHECK (climate_change >= 1 AND climate_change <= 7),
  immigration INTEGER NOT NULL CHECK (immigration >= 1 AND immigration <= 7),
  gun_control INTEGER NOT NULL CHECK (gun_control >= 1 AND gun_control <= 7),
  universal_healthcare INTEGER NOT NULL CHECK (universal_healthcare >= 1 AND universal_healthcare <= 7),
  informed_consent_agreed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_data_email ON user_data(email);
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_created_at ON user_data(created_at);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on user_data" ON user_data
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. survey_responses table
-- ============================================
CREATE TABLE survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,
  room_type VARCHAR(50),
  session_duration INTEGER NOT NULL,
  clarity VARCHAR(10) NOT NULL,
  naturalness VARCHAR(10) NOT NULL,
  difficulty VARCHAR(10) NOT NULL,
  engagement VARCHAR(10) NOT NULL,
  suspected_ai VARCHAR(20) NOT NULL,
  ai_suspicion_reason TEXT,
  overall_experience VARCHAR(10) NOT NULL,
  improvements TEXT,
  would_participate_again VARCHAR(20) NOT NULL,
  additional_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_responses_room_id ON survey_responses(room_id);
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_room_type ON survey_responses(room_type);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);

-- Disable RLS for anonymous research participants
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. exit_surveys table
-- ============================================
CREATE TABLE exit_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  room_id TEXT,
  session_type TEXT NOT NULL,
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback TEXT,
  email TEXT,
  send_csi_info BOOLEAN DEFAULT FALSE,
  send_csi_class BOOLEAN DEFAULT FALSE,
  session_duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exit_surveys_user_id ON exit_surveys(user_id);
CREATE INDEX idx_exit_surveys_session_type ON exit_surveys(session_type);
CREATE INDEX idx_exit_surveys_created_at ON exit_surveys(created_at);
CREATE INDEX idx_exit_surveys_email ON exit_surveys(email);

ALTER TABLE exit_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous access to exit_surveys" ON exit_surveys
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access to exit_surveys" ON exit_surveys
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 4. rooms table
-- ============================================
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  confederate_id TEXT,
  topic TEXT,
  llm_user_1 TEXT,
  llm_user_2 TEXT,
  llm_user_3 TEXT,
  team_assignments TEXT,
  justice_robert_id TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_type ON rooms(type);
CREATE INDEX idx_rooms_status ON rooms(status);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on rooms" ON rooms
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. room_users table
-- ============================================
CREATE TABLE room_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  position_data JSONB,
  debate_topic TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_users_room_id ON room_users(room_id);
CREATE INDEX idx_room_users_user_id ON room_users(user_id);

ALTER TABLE room_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on room_users" ON room_users
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 6. messages table (used for real-time chat)
-- ============================================
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for messages (live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- 7. Shared updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at
  BEFORE UPDATE ON survey_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exit_surveys_updated_at
  BEFORE UPDATE ON exit_surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
