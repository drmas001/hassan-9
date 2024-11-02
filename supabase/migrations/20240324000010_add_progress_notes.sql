-- Create progress_notes table
CREATE TABLE IF NOT EXISTS progress_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_progress_notes_patient_id ON progress_notes(patient_id);
CREATE INDEX idx_progress_notes_created_by ON progress_notes(created_by);

-- Create trigger for updating timestamps
CREATE TRIGGER update_progress_notes_updated_at
    BEFORE UPDATE ON progress_notes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users"
  ON progress_notes FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON progress_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for note creator"
  ON progress_notes FOR UPDATE
  USING (auth.uid()::text = created_by::text);