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
    // Using service role key with admin.createUser to bypass email confirmation
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (no confirmation email needed)
      user_metadata: {
        full_name: fullName,
        account_type: accountType || 'individual',
        organization_name: organizationName,
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'User creation failed - no user data returned' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    console.log('User created successfully:', data.user.id, data.user.email);

    // Wait a moment for the trigger to create the user record in public.users
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify user was created in public.users table
    const { data: userData, error: userCheckError } = await supabase
      .from('users')
      .select('id, role, organization_id')
      .eq('id', data.user.id)
      .single();

    if (userCheckError || !userData) {
      console.error('User not found in public.users after signup:', userCheckError);
      console.log('Attempting to manually create user record...');
      
      // Manually create organization and user if trigger didn't work
      let orgId;
      if (accountType === 'organization') {
        const { data: org } = await supabase
          .from('organizations')
          .insert({ name: organizationName || 'My Organization', account_type: 'organization' })
          .select()
          .single();
        orgId = org?.id;
      } else {
        const { data: org } = await supabase
          .from('organizations')
          .insert({ name: `${fullName || email}'s Workspace`, account_type: 'individual' })
          .select()
          .single();
        orgId = org?.id;
      }

      // Create user record manually
      const { error: manualUserError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          organization_id: orgId,
          role: accountType === 'organization' ? 'org_admin' : 'member',
        });

      if (manualUserError) {
        console.error('Manual user creation also failed:', manualUserError);
      } else {
        console.log('User manually created successfully');
      }
    } else {
      console.log('User found in public.users table:', userData);
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
      { error: 'Internal Server Error: ' + (err as Error).message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

