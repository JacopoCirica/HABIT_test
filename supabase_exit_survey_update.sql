-- Add new columns to the exit_surveys table for CSI information
ALTER TABLE exit_surveys 
ADD COLUMN email TEXT,
ADD COLUMN send_csi_info BOOLEAN DEFAULT FALSE,
ADD COLUMN send_csi_class BOOLEAN DEFAULT FALSE;

-- Create an index for efficient email lookups
CREATE INDEX IF NOT EXISTS idx_exit_surveys_email ON exit_surveys(email);

-- Update the updated_at trigger if it exists
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists for the updated_at field
DROP TRIGGER IF EXISTS update_exit_surveys_modtime ON exit_surveys;
CREATE TRIGGER update_exit_surveys_modtime
    BEFORE UPDATE ON exit_surveys
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column(); 