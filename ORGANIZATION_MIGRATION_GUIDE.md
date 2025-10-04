# Organization Features - Migration & Quick Start Guide

## 🚀 Quick Start (For New Deployments)

If you're starting fresh or don't have existing users:

### Step 1: Update Database Schema
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open `supabase-schema-organizations.sql`
4. Copy and paste the entire content
5. Click **Run**
6. Wait for success message

### Step 2: Deploy Updated Code
```bash
# Web Application
cd apps/sales-curiosity-web
npm install
npm run build
# Deploy to your hosting (Vercel, etc.)

# Chrome Extension (Optional - only if you make integration UI changes)
cd apps/sales-curiosity-extension
npm install
npm run build
```

### Step 3: Test It Out!
1. Go to your signup page
2. Choose "Organization" account type
3. Enter organization name and your details
4. Sign up and login
5. Navigate to `/admin/organization` to see the dashboard
6. Start using the app!

---

## 🔄 Migration Guide (For Existing Deployments)

If you already have users in production, follow these steps carefully:

### Before You Begin
⚠️ **BACKUP YOUR DATABASE** - Make a snapshot in Supabase before proceeding!

### Step 1: Run New Schema
```sql
-- In Supabase SQL Editor, run:
-- File: supabase-schema-organizations.sql
-- This will create new tables and add new columns
```

Note: The new schema uses `CREATE TABLE IF NOT EXISTS`, so it won't break existing tables.

### Step 2: Migrate Existing Users

**Option A: Automatic Migration (Recommended)**
Run this script in Supabase SQL Editor:

```sql
-- Migrate existing users to organization structure
DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
BEGIN
  -- Process each user without an organization
  FOR user_record IN 
    SELECT u.*, 
           COALESCE(u.full_name, u.email) as display_name
    FROM public.users u 
    WHERE u.organization_id IS NULL 
  LOOP
    -- Create a personal organization for this user
    INSERT INTO public.organizations (name, account_type, max_seats)
    VALUES (user_record.display_name || '''s Workspace', 'individual', 10)
    RETURNING id INTO new_org_id;
    
    -- Update user with organization and role
    UPDATE public.users 
    SET organization_id = new_org_id,
        role = CASE 
          -- If they were admin, make them super_admin
          WHEN user_record.is_admin = TRUE THEN 'super_admin'
          -- Otherwise, regular member
          ELSE 'member' 
        END,
        is_active = TRUE
    WHERE id = user_record.id;
    
    -- Link existing analyses to the organization
    UPDATE public.linkedin_analyses
    SET organization_id = new_org_id
    WHERE user_id = user_record.id 
      AND organization_id IS NULL;
    
    -- Log the migration
    RAISE NOTICE 'Migrated user % to organization %', user_record.email, new_org_id;
  END LOOP;
  
  RAISE NOTICE 'Migration complete!';
END $$;
```

**Option B: Manual Migration (For Small Deployments)**
1. Identify users who need organization accounts
2. Create organizations manually:
```sql
INSERT INTO public.organizations (name, account_type, max_seats)
VALUES ('Your Company Name', 'organization', 50)
RETURNING id;
```
3. Update users:
```sql
UPDATE public.users 
SET organization_id = 'org-uuid-here',
    role = 'org_admin'
WHERE email = 'admin@company.com';
```

### Step 3: Verify Migration
```sql
-- Check all users have organizations
SELECT 
  COUNT(*) as total_users,
  COUNT(organization_id) as users_with_org
FROM public.users;

-- Should show same count for both

-- Check organizations created
SELECT * FROM public.organizations;

-- Check user roles
SELECT email, role, organization_id 
FROM public.users
ORDER BY created_at;
```

### Step 4: Deploy New Code
```bash
cd apps/sales-curiosity-web
git pull origin main  # or your branch
npm install
npm run build
# Deploy to hosting
```

### Step 5: Test Everything
- [ ] Existing users can login
- [ ] Existing users can see their data
- [ ] New signups work (both individual and organization)
- [ ] Org admins can access `/admin/organization`
- [ ] Members cannot access `/admin/organization`
- [ ] Profile analyses are tracked
- [ ] Email generations are tracked

---

## 📊 Understanding the Changes

### What Changed for Existing Users?

**Before:**
- Users had an `is_admin` boolean flag
- No organization structure
- Admin dashboard at `/admin/dashboard`

**After:**
- Users have a `role` field (super_admin, org_admin, member)
- All users belong to an organization
- Individual accounts get a personal organization
- New org dashboard at `/admin/organization`
- Old admin dashboard still works for super_admins

### Backwards Compatibility

✅ **Preserved:**
- User authentication (unchanged)
- User email and profile data
- All existing analyses
- All existing functionality

⚠️ **Changed:**
- Admin access now based on `role` instead of `is_admin`
- Dashboard routes (new organization dashboard)
- Data visibility (org admins see all org data)

### New Capabilities

🎉 **Users Can Now:**
- Be part of an organization
- See team activity (if org admin)
- Have controlled access to integrations
- Save context (aboutMe, objectives)

🎉 **Organizations Can:**
- Manage multiple users
- Control integrations for all members
- View all team analyses and emails
- Invite new users
- Track usage and activity

---

## 🔧 Troubleshooting

### Issue: Users Can't Login After Migration

**Check:**
```sql
-- Verify user exists and has organization
SELECT id, email, organization_id, role, is_active
FROM public.users
WHERE email = 'user@example.com';
```

**Fix:**
If organization_id is NULL:
```sql
-- Create org and assign to user
INSERT INTO public.organizations (name, account_type)
VALUES ('User Workspace', 'individual')
RETURNING id;

-- Update user with that ID
UPDATE public.users 
SET organization_id = 'org-id-here', 
    role = 'member'
WHERE email = 'user@example.com';
```

### Issue: Org Admin Can't See Dashboard

**Check:**
```sql
-- Verify user role
SELECT email, role, organization_id 
FROM public.users 
WHERE email = 'admin@example.com';
```

**Fix:**
```sql
UPDATE public.users 
SET role = 'org_admin' 
WHERE email = 'admin@example.com';
```

### Issue: Old Analyses Not Showing in Org Dashboard

**Check:**
```sql
-- See analyses without organization
SELECT COUNT(*) 
FROM public.linkedin_analyses 
WHERE organization_id IS NULL;
```

**Fix:**
```sql
-- Link analyses to organizations via users
UPDATE public.linkedin_analyses la
SET organization_id = u.organization_id
FROM public.users u
WHERE la.user_id = u.id 
  AND la.organization_id IS NULL;
```

### Issue: RLS Policies Blocking Access

**Check:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'organizations', 'linkedin_analyses');

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'users';
```

**Fix:**
If you need to temporarily disable RLS for debugging (⚠️ NOT for production):
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ... debug ...
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Configuration Updates

### Environment Variables
No new environment variables required! Everything works with existing Supabase setup.

### Supabase Configuration
- **Row Level Security:** Must be enabled (default)
- **Realtime:** Optional (not used yet)
- **Storage:** Not required for organization features

### Chrome Extension
- No changes required initially
- To check organization integrations, use the new endpoint:
  ```typescript
  fetch(`${API_BASE}/api/organization/integrations`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  ```

---

## 🎓 Best Practices

### For Organizations
1. **Assign Org Admins Carefully** - They can see all user data
2. **Monitor Seat Usage** - Track how many seats are used vs. limit
3. **Enable Integrations Selectively** - Only enable what your team needs
4. **Regular Audits** - Review user activity and access

### For Developers
1. **Always Use RLS** - Don't bypass with service role in client code
2. **Test with Multiple Orgs** - Ensure data isolation
3. **Index on organization_id** - Already done in schema
4. **Log Important Actions** - Use audit_logs table

### For Admins
1. **Backup Before Migration** - Always!
2. **Test in Staging First** - If you have a staging environment
3. **Communicate Changes** - Tell users about new features
4. **Monitor Performance** - Watch query times after migration

---

## 🆘 Getting Help

### Check These First
1. Supabase logs (Dashboard → Logs)
2. Browser console for frontend errors
3. Network tab for API call failures
4. Database directly (SQL Editor)

### Common Error Messages

**"User not found"**
- User might not have organization assigned
- Run migration script

**"Forbidden"**
- RLS policy blocking access
- Check user's role and organization_id

**"Invalid token"**
- Auth session expired
- User needs to login again

**"Organization not found"**
- User's organization_id is NULL
- Assign user to an organization

---

## ✅ Post-Migration Checklist

After completing migration:

- [ ] All users can login
- [ ] All users have an organization_id
- [ ] All analyses linked to organizations
- [ ] RLS policies are active
- [ ] Org admins can access dashboard
- [ ] Regular members cannot access org dashboard
- [ ] New signups work (both types)
- [ ] Email generation tracking works
- [ ] Integration toggles work
- [ ] No console errors in browser
- [ ] No errors in Supabase logs
- [ ] Database backup is recent
- [ ] Users notified of new features

---

## 📚 Additional Resources

- **Full Feature Documentation:** See `ORGANIZATION_FEATURES.md`
- **Database Schema:** See `supabase-schema-organizations.sql`
- **API Documentation:** Check individual route files
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security

---

## 🎉 You're All Set!

Your Sales Curiosity Engine now has full organization support! Users can:
- ✅ Create organization accounts
- ✅ Invite team members
- ✅ Manage integrations
- ✅ View team activity
- ✅ Track all analyses and emails

Next steps: Implement email invitations, billing, and advanced features from `ORGANIZATION_FEATURES.md`

