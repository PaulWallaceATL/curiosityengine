-- Sales Curiosity Engine Database Schema - Organization Support
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/mrdqdgztzwboglkrtaui/sql
-- This extends the existing schema with organization features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'organization' CHECK (account_type IN ('individual', 'organization')),
  domain TEXT, -- Optional: for email domain verification
  billing_email TEXT,
  max_seats INTEGER DEFAULT 10, -- Number of users allowed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb -- For org-specific settings like logo, theme, etc.
);

-- Updated Users table (extends Supabase auth.users)
-- DROP existing users table if running fresh, otherwise ALTER
-- For migration, use ALTER commands below
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'org_admin', 'member')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_context JSONB DEFAULT '{}'::jsonb -- Store aboutMe, objectives from extension
);

-- LinkedIn Profile Analyses (updated to include organization_id for easier querying)
CREATE TABLE IF NOT EXISTS public.linkedin_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  linkedin_url TEXT NOT NULL,
  profile_name TEXT,
  profile_headline TEXT,
  profile_location TEXT,
  profile_data JSONB,
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Generations table (NEW - track all generated emails)
CREATE TABLE IF NOT EXISTS public.email_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  linkedin_url TEXT,
  profile_name TEXT,
  subject TEXT,
  body TEXT,
  email_context TEXT, -- User's specific instructions for this email
  tone TEXT DEFAULT 'professional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Integrations (control which integrations are enabled per org)
CREATE TABLE IF NOT EXISTS public.organization_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('salesforce', 'hubspot', 'gmail', 'outlook', 'calendar', 'slack', 'teams')),
  is_enabled BOOLEAN DEFAULT FALSE,
  configuration JSONB DEFAULT '{}'::jsonb, -- Store API keys, OAuth tokens, etc.
  enabled_at TIMESTAMP WITH TIME ZONE,
  enabled_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, integration_type)
);

-- User Invitations table (for inviting users to organizations)
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('org_admin', 'member')),
  invited_by UUID REFERENCES public.users(id),
  invitation_token TEXT UNIQUE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Audit Log (track important actions within organizations)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'user_created', 'integration_enabled', 'analysis_created'
  resource_type TEXT, -- e.g., 'user', 'integration', 'analysis'
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_linkedin_analyses_user_id ON public.linkedin_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_analyses_organization_id ON public.linkedin_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_analyses_created_at ON public.linkedin_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_generations_user_id ON public.email_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_generations_organization_id ON public.email_generations(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_generations_created_at ON public.email_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organization_integrations_org_id ON public.organization_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations table
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
    )
  );

-- RLS Policies for users table
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view members of their organization"
  ON public.users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Org admins can manage users in their organization"
  ON public.users FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
    )
  );

-- RLS Policies for linkedin_analyses table
CREATE POLICY "Users can view their own analyses"
  ON public.linkedin_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON public.linkedin_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org admins can view all analyses in their organization"
  ON public.linkedin_analyses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
    )
  );

-- RLS Policies for email_generations table
CREATE POLICY "Users can view their own email generations"
  ON public.email_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email generations"
  ON public.email_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org admins can view all email generations in their organization"
  ON public.email_generations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
    )
  );

-- RLS Policies for organization_integrations table
CREATE POLICY "Org members can view their organization's integrations"
  ON public.organization_integrations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage their organization's integrations"
  ON public.organization_integrations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
    )
  );

-- RLS Policies for user_invitations table
CREATE POLICY "Org admins can manage invitations in their organization"
  ON public.user_invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Org admins can view audit logs in their organization"
  ON public.audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
    )
  );

-- Function to automatically create user record and organization on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_account_type TEXT;
  v_org_name TEXT;
  v_user_role TEXT;
BEGIN
  -- Extract metadata from signup
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual');
  v_org_name := NEW.raw_user_meta_data->>'organization_name';
  
  -- If organization account, create organization first
  IF v_account_type = 'organization' THEN
    INSERT INTO public.organizations (name, account_type)
    VALUES (COALESCE(v_org_name, 'My Organization'), 'organization')
    RETURNING id INTO v_org_id;
    
    v_user_role := 'org_admin'; -- First user is always org admin
  ELSE
    -- For individual accounts, create a personal organization
    INSERT INTO public.organizations (name, account_type)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Workspace', 'individual')
    RETURNING id INTO v_org_id;
    
    v_user_role := 'member';
  END IF;
  
  -- Create user record
  INSERT INTO public.users (id, email, full_name, organization_id, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    v_org_id,
    v_user_role
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_organization_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_organization_id,
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      role = required_role 
      OR role = 'super_admin'
      OR (required_role = 'member' AND role IN ('org_admin', 'super_admin'))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.linkedin_analyses TO authenticated;
GRANT SELECT, INSERT ON public.email_generations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Initial setup: If you have existing users, you'll need to:
-- 1. Create organizations for them
-- 2. Link users to organizations
-- 3. Set appropriate roles

-- Example migration for existing users (run after creating tables):
-- DO $$
-- DECLARE
--   user_record RECORD;
--   new_org_id UUID;
-- BEGIN
--   FOR user_record IN SELECT * FROM public.users WHERE organization_id IS NULL LOOP
--     INSERT INTO public.organizations (name, account_type)
--     VALUES (user_record.full_name || '''s Workspace', 'individual')
--     RETURNING id INTO new_org_id;
--     
--     UPDATE public.users 
--     SET organization_id = new_org_id,
--         role = CASE WHEN is_admin THEN 'super_admin' ELSE 'member' END
--     WHERE id = user_record.id;
--   END LOOP;
-- END $$;

