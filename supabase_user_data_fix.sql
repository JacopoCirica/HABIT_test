-- Fix for user_data table timestamp constraints
-- If the table already exists, this will help fix the constraint issues

-- First, let's make sure the table has proper defaults
-- If you're getting constraint errors, you may need to drop and recreate the table

-- Drop the table if it exists (WARNING: This will delete existing data)
-- DROP TABLE IF EXISTS user_data;

-- Create a simpler version of user_data table with better defaults
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Account information
  email VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Personal information
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  sex VARCHAR(20) NOT NULL,
  education VARCHAR(50) NOT NULL,
  occupation VARCHAR(255) NOT NULL,
  
  -- Demographics/Opinion data (Likert scale 1-7)
  vaccination INTEGER NOT NULL CHECK (vaccination >= 1 AND vaccination <= 7),
  climate_change INTEGER NOT NULL CHECK (climate_change >= 1 AND climate_change <= 7),
  immigration INTEGER NOT NULL CHECK (immigration >= 1 AND immigration <= 7),
  gun_control INTEGER NOT NULL CHECK (gun_control >= 1 AND gun_control <= 7),
  universal_healthcare INTEGER NOT NULL CHECK (universal_healthcare >= 1 AND universal_healthcare <= 7),
  
  -- Consent tracking
  informed_consent_agreed BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps with explicit defaults
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_data_email ON user_data(email);
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_created_at ON user_data(created_at);

-- Enable RLS and create permissive policy
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on user_data" ON user_data;

-- Create new policy
CREATE POLICY "Allow all operations on user_data" ON user_data
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Alternative: If you want to disable RLS entirely for this research table
-- ALTER TABLE user_data DISABLE ROW LEVEL SECURITY; 