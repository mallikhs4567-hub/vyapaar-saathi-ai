-- Add user_id column to Sales table to track ownership
ALTER TABLE public."Sales" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to Inventory table to track ownership
ALTER TABLE public."Inventory" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for Sales table
CREATE POLICY "Users can view their own sales"
ON public."Sales"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
ON public."Sales"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
ON public."Sales"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
ON public."Sales"
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for Inventory table
CREATE POLICY "Users can view their own inventory"
ON public."Inventory"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory"
ON public."Inventory"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
ON public."Inventory"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory"
ON public."Inventory"
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);