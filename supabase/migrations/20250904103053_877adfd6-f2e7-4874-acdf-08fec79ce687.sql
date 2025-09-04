-- Make shop_category nullable initially since it's filled during profile setup
ALTER TABLE public.profiles ALTER COLUMN shop_category DROP NOT NULL;

-- Update the trigger function to handle missing shop_category
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, shop_category)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'shop_category', 'Other')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;