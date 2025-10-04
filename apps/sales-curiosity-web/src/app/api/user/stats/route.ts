import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  const allowed = [
    'chrome-extension://',
    process.env.NEXT_PUBLIC_APP_URL || '',
    'https://your-app.vercel.app'
  ];
  return allowed.some((prefix) => origin.startsWith(prefix));
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return NextResponse.json({}, { status: 200, headers: corsHeaders(origin) });
}

// GET user's stats
export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // Get user's organization info
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role, organizations(name, account_type)')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const organizationId = userData.organization_id;
    const isOrgAdmin = userData.role === 'org_admin' || userData.role === 'super_admin';
    const isOrgMember = userData.organizations.account_type === 'organization';

    // Get user's analyses count
    const { count: analysesCount } = await supabase
      .from('linkedin_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get user's emails count
    const { count: emailsCount } = await supabase
      .from('email_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get recent analyses (last 3)
    const { data: recentAnalyses } = await supabase
      .from('linkedin_analyses')
      .select('profile_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    let teamStats = null;
    if (isOrgAdmin && isOrgMember) {
      // Get team stats for org admins
      const { count: teamAnalysesCount } = await supabase
        .from('linkedin_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      const { count: teamEmailsCount } = await supabase
        .from('email_generations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      const { count: teamMembersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      teamStats = {
        totalAnalyses: teamAnalysesCount || 0,
        totalEmails: teamEmailsCount || 0,
        activeMembers: teamMembersCount || 0,
      };
    }

    return NextResponse.json(
      {
        ok: true,
        userStats: {
          analysesCount: analysesCount || 0,
          emailsCount: emailsCount || 0,
          recentAnalyses: recentAnalyses || [],
        },
        teamStats,
        organization: userData.organizations,
        userRole: userData.role,
      },
      { headers: corsHeaders(origin) }
    );

  } catch (err) {
    console.error('Error in user stats endpoint:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

