-- Create user_data table for storing signup information and demographics
CREATE TABLE user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Account information
  email VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) UNIQUE NOT NULL, -- Internal user ID used in sessions
  
  -- Personal information (from pre-survey)
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  sex VARCHAR(20) NOT NULL, -- 'male', 'female'
  education VARCHAR(50) NOT NULL, -- 'high-school', 'bachelors', 'masters', 'doctorate', 'other'
  occupation VARCHAR(255) NOT NULL,
  
  -- Demographics/Opinion data (from demographics survey - Likert scale 1-7)
  vaccination INTEGER NOT NULL CHECK (vaccination >= 1 AND vaccination <= 7),
  climate_change INTEGER NOT NULL CHECK (climate_change >= 1 AND climate_change <= 7),
  immigration INTEGER NOT NULL CHECK (immigration >= 1 AND immigration <= 7),
  gun_control INTEGER NOT NULL CHECK (gun_control >= 1 AND gun_control <= 7),
  universal_healthcare INTEGER NOT NULL CHECK (universal_healthcare >= 1 AND universal_healthcare <= 7),
  
  -- Consent tracking
  informed_consent_agreed BOOLEAN NOT NULL DEFAULT true,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_data_email ON user_data(email);
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_created_at ON user_data(created_at);

-- Enable Row Level Security (RLS) - but allow all operations for research app
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (appropriate for research app with anonymous users)
CREATE POLICY "Allow all operations on user_data" ON user_data
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_data IS 'Stores user signup information, personal details, and demographic opinions';
COMMENT ON COLUMN user_data.user_id IS 'Internal user ID used throughout the application';
COMMENT ON COLUMN user_data.vaccination IS 'Opinion on vaccination safety/efficacy (1-7 Likert scale)';
COMMENT ON COLUMN user_data.climate_change IS 'Opinion on climate change as serious threat (1-7 Likert scale)';
COMMENT ON COLUMN user_data.immigration IS 'Opinion on immigration benefits (1-7 Likert scale)';
COMMENT ON COLUMN user_data.gun_control IS 'Opinion on gun control effectiveness (1-7 Likert scale)';
COMMENT ON COLUMN user_data.universal_healthcare IS 'Opinion on universal healthcare (1-7 Likert scale)'; 