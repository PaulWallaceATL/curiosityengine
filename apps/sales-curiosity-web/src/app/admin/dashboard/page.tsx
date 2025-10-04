'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'org_admin' | 'member';
  created_at: string;
}

interface Analysis {
  id: string;
  user_id: string;
  linkedin_url: string;
  profile_name: string;
  profile_headline: string;
  created_at: string;
  users: User;
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role === 'member') {
      router.push('/');
      return;
    }

    setCurrentUser(userData);
    loadData();
  }

  async function loadData() {
    setLoading(true);
    
    // Load all users
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // Load all analyses with user info
    const { data: analysesData } = await supabase
      .from('linkedin_analyses')
      .select('*, users(email, full_name)')
      .order('created_at', { ascending: false });

    setUsers(usersData || []);
    setAnalyses(analysesData || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAnalyses = selectedUser
    ? analyses.filter(a => a.user_id === selectedUser)
    : analyses.filter(a =>
        a.profile_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.linkedin_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.users.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f7fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#718096' }}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '4px'
            }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#718096' }}>
              Welcome back, {currentUser?.full_name || currentUser?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
              Total Users
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
              {users.length}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
              Total Analyses
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
              {analyses.length}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
              Admins
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
              {users.filter(u => u.role === 'org_admin' || u.role === 'super_admin').length}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search users, emails, or LinkedIn profiles..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedUser(null);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          gap: '24px'
        }}>
          {/* Users List */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            maxHeight: '800px',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e2e8f0',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 1
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a202c'
              }}>
                Users ({filteredUsers.length})
              </h2>
            </div>

            {filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f7fafc',
                  cursor: 'pointer',
                  background: selectedUser === user.id ? '#edf2f7' : 'white',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => {
                  if (selectedUser !== user.id) {
                    e.currentTarget.style.background = '#f7fafc';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedUser !== user.id) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#1a202c',
                  marginBottom: '4px'
                }}>
                  {user.full_name || 'No name'}
                  {(user.role === 'org_admin' || user.role === 'super_admin') && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      background: '#667eea',
                      color: 'white',
                      fontSize: '10px',
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#718096' }}>
                  {user.email}
                </div>
                <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Analyses List */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            maxHeight: '800px',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e2e8f0',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 1
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a202c'
              }}>
                LinkedIn Analyses ({filteredAnalyses.length})
                {selectedUser && (
                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{
                      marginLeft: '12px',
                      padding: '4px 12px',
                      background: '#e2e8f0',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Filter
                  </button>
                )}
              </h2>
            </div>

            {filteredAnalyses.map(analysis => (
              <div
                key={analysis.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f7fafc'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#1a202c',
                      marginBottom: '4px'
                    }}>
                      {analysis.profile_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>
                      {analysis.profile_headline}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'right' }}>
                    {new Date(analysis.created_at).toLocaleString()}
                  </div>
                </div>
                <a
                  href={analysis.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: '#667eea',
                    textDecoration: 'none',
                    display: 'block',
                    marginBottom: '8px'
                  }}
                >
                  {analysis.linkedin_url}
                </a>
                <div style={{
                  fontSize: '12px',
                  color: '#718096',
                  padding: '6px 10px',
                  background: '#f7fafc',
                  borderRadius: '4px'
                }}>
                  User: {analysis.users.full_name || analysis.users.email}
                </div>
              </div>
            ))}

            {filteredAnalyses.length === 0 && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#a0aec0'
              }}>
                No analyses found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

