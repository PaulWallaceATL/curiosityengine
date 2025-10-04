-- Quick Database Health Check
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Check existing users
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.organization_id,
  o.name as org_name,
  o.account_type
FROM public.users u
LEFT JOIN public.organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. Check auth.users (Supabase auth table)
SELECT 
  id,
  email,
  raw_user_meta_data,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check organizations
SELECT * FROM public.organizations ORDER BY created_at DESC LIMIT 10;

-- ========================================
-- TROUBLESHOOTING COMMANDS
-- ========================================

-- If you need to manually create a user record that's missing:
-- (Replace with actual user ID from auth.users)
/*
DO $$
DECLARE
  v_user_id UUID := 'YOUR-USER-ID-HERE';
  v_email TEXT := 'user@example.com';
  v_full_name TEXT := 'John Doe';
  v_account_type TEXT := 'individual'; -- or 'organization'
  v_org_name TEXT := 'My Organization';
  v_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO public.organizations (name, account_type)
  VALUES (v_org_name, v_account_type)
  RETURNING id INTO v_org_id;
  
  -- Create user
  INSERT INTO public.users (id, email, full_name, organization_id, role)
  VALUES (
    v_user_id,
    v_email,
    v_full_name,
    v_org_id,
    CASE WHEN v_account_type = 'organization' THEN 'org_admin' ELSE 'member' END
  );
END $$;
*/

-- To disable email confirmation temporarily (for testing):
-- Go to Supabase Dashboard → Authentication → Settings → Email Auth
-- Uncheck "Enable email confirmations"

-- To manually confirm an email:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'user@example.com';

-- To clear all test data:
-- DELETE FROM public.users WHERE email LIKE '%test%';
-- DELETE FROM auth.users WHERE email LIKE '%test%';

