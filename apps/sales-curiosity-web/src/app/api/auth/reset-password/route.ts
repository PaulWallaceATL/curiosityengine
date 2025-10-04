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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://curiosityengine-sales-curiosity-web.vercel.app'}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { 
        ok: true, 
        message: 'Password reset email sent successfully'
      },
      { headers: corsHeaders(origin) }
    );
  } catch (err) {
    console.error('Password reset error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

