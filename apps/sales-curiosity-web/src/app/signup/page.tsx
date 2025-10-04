'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AccountType = 'individual' | 'organization';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for message in URL
    const message = searchParams.get('message');
    if (message) {
      setInfoMessage(message);
    }
  }, [searchParams]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (accountType === 'organization' && !organizationName.trim()) {
      setError('Organization name is required');
      setLoading(false);
      return;
    }

    try {
      // Call our signup API which uses admin.createUser with email_confirm
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          accountType,
          organizationName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?message=Account created! Please sign in.');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Account Created!</h2>
          <p style={{ color: '#718096' }}>Redirecting to login...</p>
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
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#1a202c'
        }}>
          Create Account
        </h1>
        <p style={{
          color: '#718096',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          Get started with Sales Curiosity
        </p>

        {infoMessage && (
          <div style={{
            padding: '12px',
            background: '#dbeafe',
            color: '#1e40af',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {infoMessage}
          </div>
        )}

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

        <form onSubmit={handleSignup}>
          {/* Account Type Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '12px',
              color: '#2d3748'
            }}>
              Account Type
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setAccountType('individual')}
                style={{
                  flex: 1,
                  padding: '16px',
                  border: accountType === 'individual' ? '2px solid #667eea' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  background: accountType === 'individual' ? '#eef2ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>👤</div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: accountType === 'individual' ? '#667eea' : '#2d3748',
                  marginBottom: '4px'
                }}>
                  Individual
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>
                  For personal use
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAccountType('organization')}
                style={{
                  flex: 1,
                  padding: '16px',
                  border: accountType === 'organization' ? '2px solid #667eea' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  background: accountType === 'organization' ? '#eef2ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏢</div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: accountType === 'organization' ? '#667eea' : '#2d3748',
                  marginBottom: '4px'
                }}>
                  Organization
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>
                  For teams & companies
                </div>
              </button>
            </div>
          </div>

          {accountType === 'organization' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#2d3748'
              }}>
                Organization Name
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                placeholder="Acme Corp"
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
          )}

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
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
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
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#a0aec0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
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

export default function SignupPage() {
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
      <SignupForm />
    </Suspense>
  );
}

