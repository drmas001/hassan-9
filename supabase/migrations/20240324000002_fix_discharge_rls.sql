-- Drop existing RLS policies for discharges
DROP POLICY IF EXISTS "Users can view all discharges" ON discharges;
DROP POLICY IF EXISTS "Users can insert discharges" ON discharges;

-- Create comprehensive RLS policies for discharges
CREATE POLICY "Enable read access for all authenticated users"
ON discharges FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON discharges FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON discharges FOR UPDATE
USING (true);

-- Create policy for delete (restricted to admins)
CREATE POLICY "Enable delete for admins only"
ON discharges FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  )
);