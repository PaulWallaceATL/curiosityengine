export interface Organization {
  id: string;
  name: string;
  account_type: 'individual' | 'organization';
  domain?: string;
  billing_email?: string;
  max_seats: number;
  created_at: string;
  updated_at: string;
  settings?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  organization_id: string;
  role: 'super_admin' | 'org_admin' | 'member';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_context?: {
    aboutMe?: string;
    objectives?: string;
  };
  organizations?: Organization;
}

export interface LinkedInAnalysis {
  id: string;
  user_id: string;
  organization_id: string;
  linkedin_url: string;
  profile_name?: string;
  profile_headline?: string;
  profile_location?: string;
  profile_data?: Record<string, unknown>;
  ai_analysis: string;
  created_at: string;
  users?: {
    email: string;
    full_name?: string;
  };
}

export interface EmailGeneration {
  id: string;
  user_id: string;
  organization_id: string;
  linkedin_url?: string;
  profile_name?: string;
  subject: string;
  body: string;
  email_context?: string;
  tone?: string;
  created_at: string;
  users?: {
    email: string;
    full_name?: string;
  };
}

export interface OrganizationIntegration {
  id: string;
  organization_id: string;
  integration_type: 'salesforce' | 'hubspot' | 'gmail' | 'outlook' | 'calendar' | 'slack' | 'teams';
  is_enabled: boolean;
  configuration?: Record<string, unknown>;
  enabled_at?: string;
  enabled_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'org_admin' | 'member';
  invited_by: string;
  invitation_token: string;
  accepted_at?: string;
  expires_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export type TaskType = 'research' | 'email' | 'briefing';

export interface Task {
  id: string;
  user_id: string;
  type: TaskType;
  description: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}


