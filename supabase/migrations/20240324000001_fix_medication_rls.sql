-- Drop existing RLS policies for medications
DROP POLICY IF EXISTS "Users can view all medications" ON medications;
DROP POLICY IF EXISTS "Users can update active medications" ON medications;
DROP POLICY IF EXISTS "Users can insert medications" ON medications;

-- Create comprehensive RLS policies for medications
CREATE POLICY "Enable read access for all authenticated users"
ON medications FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON medications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON medications FOR UPDATE
USING (true);

-- Create policy for delete (restricted to admins)
CREATE POLICY "Enable delete for admins only"
ON medications FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  )
);