import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || '';
    const body = await req.json();
    const { email, password, fullName, accountType, organizationName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (accountType === 'organization' && !organizationName) {
      return NextResponse.json(
        { error: 'Organization name is required for organization accounts' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Create user with Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType || 'individual',
          organization_name: organizationName,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { 
        ok: true, 
        user: data.user,
        message: accountType === 'organization' 
          ? 'Organization account created successfully! You are now the organization administrator.'
          : 'Account created successfully!'
      },
      { headers: corsHeaders(origin) }
    );
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

