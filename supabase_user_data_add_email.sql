-- Add email column to the user_data table
ALTER TABLE user_data 
ADD COLUMN email TEXT;

-- Create an index for efficient email lookups
CREATE INDEX IF NOT EXISTS idx_user_data_email ON user_data(email);

-- Update the updated_at trigger if it exists
CREATE OR REPLACE FUNCTION update_user_data_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists for the updated_at field
DROP TRIGGER IF EXISTS update_user_data_modtime ON user_data;
CREATE TRIGGER update_user_data_modtime
    BEFORE UPDATE ON user_data
    FOR EACH ROW
    EXECUTE PROCEDURE update_user_data_modified_column(); 