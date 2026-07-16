/*
# Auto-create profile on user signup

## Problem
No trigger existed to create a `profiles` row when a new auth user
registers. The client calls `loadProfile()` after signup, gets null,
and the user appears stuck — "nothing happens" after registering.

## Fix
1. Create a `handle_new_user()` function that inserts a profile row
   with the new user's ID and username (from raw_user_meta_data).
2. Attach it as an AFTER INSERT trigger on `auth.users`.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
