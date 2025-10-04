'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function InviteAcceptContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }
    verifyInvitation(token);
  }, [searchParams]);

  async function verifyInvitation(token: string) {
    try {
      // Check if invitation exists and is valid
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*, organizations(name)')
        .eq('invitation_token', token)
        .is('accepted_at', null)
        .single();

      if (error || !data) {
        setError('This invitation link is invalid or has already been used.');
        setLoading(false);
        return;
      }

      // Check if expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setError('This invitation has expired. Please request a new invitation.');
        setLoading(false);
        return;
      }

      setInviteData(data);
      setEmail(data.email);
      setLoading(false);
    } catch (err) {
      console.error('Error verifying invitation:', err);
      setError('Failed to verify invitation. Please try again.');
      setLoading(false);
    }
  }

  async function handleAcceptInvite(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Create the user account
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: 'organization', // They're joining an existing org
            invitation_token: inviteData.invitation_token,
          },
        },
      });

      if (signupError) throw signupError;

      // Wait a moment for the trigger to create the user record
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the user to join the organization
      const { error: updateError } = await supabase
        .from('users')
        .update({
          organization_id: inviteData.organization_id,
          role: inviteData.role, // Use the role from the invitation
        })
        .eq('id', signupData.user!.id);

      if (updateError) throw updateError;

      // Mark invitation as accepted
      const { error: acceptError } = await supabase
        .from('user_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('invitation_token', inviteData.invitation_token);

      if (acceptError) console.error('Error marking invitation as accepted:', acceptError);

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_organization_id: inviteData.organization_id,
        p_action: 'user_accepted_invitation',
        p_resource_type: 'user',
        p_resource_id: signupData.user!.id,
        p_details: { role: inviteData.role, email: email }
      }).catch(err => console.error('Audit log error:', err));

      // Redirect to login
      router.push('/login?message=Account created! Please sign in to continue.');
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#718096' }}>Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '8px',
            color: '#1a202c'
          }}>
            Invalid Invitation
          </h1>
          <p style={{
            color: '#718096',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </p>
          <a
            href="/signup"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Create New Account
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '450px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '8px',
            color: '#1a202c'
          }}>
            You're Invited!
          </h1>
          <p style={{
            color: '#718096',
            fontSize: '14px'
          }}>
            Join <strong>{inviteData?.organizations?.name}</strong> as{' '}
            {inviteData?.role === 'org_admin' ? 'an administrator' : 'a team member'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fed7d7',
            color: '#c53030',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAcceptInvite}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#2d3748'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                color: '#1a202c',
                background: '#f7fafc'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#718096',
              marginTop: '4px'
            }}>
              This email is pre-filled from your invitation
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#2d3748'
            }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                color: '#1a202c'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#2d3748'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                color: '#1a202c'
              }}
            />
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
              At least 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              background: submitting ? '#a0aec0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Creating Account...' : 'Accept Invitation & Join'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#718096'
        }}>
          Already have an account?{' '}
          <a
            href="/login"
            style={{
              color: '#667eea',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    }>
      <InviteAcceptContent />
    </Suspense>
  );
}

