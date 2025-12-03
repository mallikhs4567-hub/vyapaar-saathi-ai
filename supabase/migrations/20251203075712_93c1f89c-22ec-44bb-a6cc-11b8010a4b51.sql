-- Add shop contact details to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shop_address text,
ADD COLUMN IF NOT EXISTS shop_phone text,
ADD COLUMN IF NOT EXISTS shop_email text;