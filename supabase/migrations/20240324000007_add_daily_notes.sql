-- Create daily_notes table
CREATE TABLE IF NOT EXISTS daily_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_daily_notes_patient_id ON daily_notes(patient_id);
CREATE INDEX idx_daily_notes_note_date ON daily_notes(note_date);
CREATE INDEX idx_daily_notes_created_by ON daily_notes(created_by);

-- Enable Row Level Security
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all authenticated users"
  ON daily_notes FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON daily_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for note creator"
  ON daily_notes FOR UPDATE
  USING (auth.uid()::text = created_by::text);

-- Create trigger for updating timestamps
CREATE TRIGGER update_daily_notes_updated_at
  BEFORE UPDATE ON daily_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();