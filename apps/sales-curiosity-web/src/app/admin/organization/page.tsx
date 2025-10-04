'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  account_type: string;
  max_seats: number;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  user_context: {
    aboutMe?: string;
    objectives?: string;
  };
}

interface Analysis {
  id: string;
  user_id: string;
  linkedin_url: string;
  profile_name: string;
  profile_headline: string;
  created_at: string;
  users: {
    email: string;
    full_name: string;
  };
}

interface EmailGeneration {
  id: string;
  user_id: string;
  linkedin_url: string;
  profile_name: string;
  subject: string;
  body: string;
  created_at: string;
  users: {
    email: string;
    full_name: string;
  };
}

interface Integration {
  id: string;
  integration_type: string;
  is_enabled: boolean;
  enabled_at: string;
}

type TabType = 'overview' | 'users' | 'analyses' | 'emails' | 'integrations';

export default function OrganizationDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [emails, setEmails] = useState<EmailGeneration[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'org_admin' | 'member'>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
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

    // Check if user is org admin
    const { data: userData } = await supabase
      .from('users')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role === 'member') {
      router.push('/');
      return;
    }

    setCurrentUser(userData);
    setOrganization(userData.organizations);
    loadData(userData.organization_id);
  }

  async function loadData(organizationId: string) {
    setLoading(true);
    
    // Load all users in organization
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Load all analyses in organization
    const { data: analysesData } = await supabase
      .from('linkedin_analyses')
      .select('*, users(email, full_name)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Load all email generations in organization
    const { data: emailsData } = await supabase
      .from('email_generations')
      .select('*, users(email, full_name)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Load organization integrations
    const { data: integrationsData } = await supabase
      .from('organization_integrations')
      .select('*')
      .eq('organization_id', organizationId);

    setUsers(usersData || []);
    setAnalyses(analysesData || []);
    setEmails(emailsData || []);
    setIntegrations(integrationsData || []);
    setLoading(false);
  }

  async function handleInviteUser() {
    if (!organization || !inviteEmail) return;

    setInviteLoading(true);
    try {
      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from('user_invitations')
        .insert({
          organization_id: organization.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: currentUser?.id,
          invitation_token: token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      // TODO: Send invitation email
      alert(`Invitation sent to ${inviteEmail}! (Email integration pending)`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err: any) {
      alert('Failed to send invitation: ' + err.message);
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleToggleIntegration(integrationType: string, currentlyEnabled: boolean) {
    if (!organization) return;

    try {
      const { error } = await supabase
        .from('organization_integrations')
        .upsert({
          organization_id: organization.id,
          integration_type: integrationType,
          is_enabled: !currentlyEnabled,
          enabled_at: !currentlyEnabled ? new Date().toISOString() : null,
          enabled_by: currentUser?.id,
        }, {
          onConflict: 'organization_id,integration_type'
        });

      if (error) throw error;

      // Reload integrations
      loadData(organization.id);
    } catch (err: any) {
      alert('Failed to toggle integration: ' + err.message);
    }
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
        a.linkedin_url.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const filteredEmails = selectedUser
    ? emails.filter(e => e.user_id === selectedUser)
    : emails.filter(e =>
        e.profile_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <p style={{ color: '#718096' }}>Loading organization dashboard...</p>
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
              {organization?.name} Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#718096' }}>
              Organization Admin • {currentUser?.full_name || currentUser?.email}
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

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '32px'
        }}>
          {(['overview', 'users', 'analyses', 'emails', 'integrations'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #667eea' : '2px solid transparent',
                color: activeTab === tab ? '#667eea' : '#718096',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
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
                  {users.length} / {organization?.max_seats}
                </p>
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                  Active seats
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                  Profile Analyses
                </p>
                <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                  {analyses.length}
                </p>
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                  Total analyzed
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                  Emails Generated
                </p>
                <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                  {emails.length}
                </p>
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                  Total created
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                  Active Integrations
                </p>
                <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                  {integrations.filter(i => i.is_enabled).length}
                </p>
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                  Enabled services
                </p>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Recent Activity
              </h2>
              <div style={{ color: '#718096', fontSize: '14px' }}>
                <p style={{ marginBottom: '12px' }}>
                  • {analyses.filter(a => {
                    const dayAgo = new Date();
                    dayAgo.setDate(dayAgo.getDate() - 1);
                    return new Date(a.created_at) > dayAgo;
                  }).length} analyses in the last 24 hours
                </p>
                <p style={{ marginBottom: '12px' }}>
                  • {emails.filter(e => {
                    const dayAgo = new Date();
                    dayAgo.setDate(dayAgo.getDate() - 1);
                    return new Date(e.created_at) > dayAgo;
                  }).length} emails generated in the last 24 hours
                </p>
                <p>
                  • {users.filter(u => u.is_active).length} active users
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  marginRight: '12px'
                }}
              />
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Invite User
              </button>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    padding: '20px',
                    borderBottom: index < filteredUsers.length - 1 ? '1px solid #f7fafc' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedUser(user.id === selectedUser ? null : user.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#1a202c',
                        marginBottom: '4px'
                      }}>
                        {user.full_name || 'No name'}
                        {user.role === 'org_admin' && (
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
                        {!user.is_active && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            background: '#f56565',
                            color: 'white',
                            fontSize: '10px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#718096', marginBottom: '4px' }}>
                        {user.email}
                      </div>
                      <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>

                      {selectedUser === user.id && user.user_context && (
                        <div style={{
                          marginTop: '16px',
                          padding: '12px',
                          background: '#f7fafc',
                          borderRadius: '8px',
                          fontSize: '13px'
                        }}>
                          {user.user_context.aboutMe && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong>About:</strong> {user.user_context.aboutMe}
                            </div>
                          )}
                          {user.user_context.objectives && (
                            <div>
                              <strong>Objectives:</strong> {user.user_context.objectives}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#718096' }}>
                      {analyses.filter(a => a.user_id === user.id).length} analyses<br />
                      {emails.filter(e => e.user_id === user.id).length} emails
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyses Tab */}
        {activeTab === 'analyses' && (
          <div>
            <input
              type="text"
              placeholder="Search profiles..."
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
                outline: 'none',
                marginBottom: '20px'
              }}
            />

            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {filteredAnalyses.map((analysis, index) => (
                <div
                  key={analysis.id}
                  style={{
                    padding: '20px',
                    borderBottom: index < filteredAnalyses.length - 1 ? '1px solid #f7fafc' : 'none'
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
                      <div style={{ fontSize: '13px', color: '#718096', marginBottom: '4px' }}>
                        {analysis.profile_headline}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0aec0', textAlign: 'right' }}>
                      {new Date(analysis.created_at).toLocaleString()}
                    </div>
                  </div>
                  <a
                    href={analysis.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '13px',
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
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    By: {analysis.users.full_name || analysis.users.email}
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
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <div>
            <input
              type="text"
              placeholder="Search emails..."
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
                outline: 'none',
                marginBottom: '20px'
              }}
            />

            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {filteredEmails.map((email, index) => (
                <div
                  key={email.id}
                  style={{
                    padding: '20px',
                    borderBottom: index < filteredEmails.length - 1 ? '1px solid #f7fafc' : 'none'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#1a202c',
                        marginBottom: '4px'
                      }}>
                        {email.subject}
                      </div>
                      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px' }}>
                        To: {email.profile_name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#2d3748',
                        padding: '12px',
                        background: '#f7fafc',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        maxHeight: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {email.body.substring(0, 200)}...
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'right', marginLeft: '16px' }}>
                      {new Date(email.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#718096',
                    padding: '6px 10px',
                    background: '#f7fafc',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    By: {email.users.full_name || email.users.email}
                  </div>
                </div>
              ))}

              {filteredEmails.length === 0 && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#a0aec0'
                }}>
                  No emails found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Manage Integrations
              </h2>
              <p style={{ fontSize: '14px', color: '#718096', marginBottom: '20px' }}>
                Control which integrations are available to your team members. Only enabled integrations will appear in the user's extension.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {['salesforce', 'hubspot', 'gmail', 'outlook', 'calendar', 'slack'].map(integrationType => {
                const integration = integrations.find(i => i.integration_type === integrationType);
                const isEnabled = integration?.is_enabled || false;

                return (
                  <div
                    key={integrationType}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: isEnabled ? '2px solid #667eea' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        color: '#1a202c'
                      }}>
                        {integrationType}
                      </h3>
                      {isEnabled && (
                        <span style={{
                          padding: '4px 8px',
                          background: '#48bb78',
                          color: 'white',
                          fontSize: '10px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          ENABLED
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: '#718096',
                      marginBottom: '16px'
                    }}>
                      {isEnabled 
                        ? `Available to all team members since ${new Date(integration.enabled_at).toLocaleDateString()}`
                        : 'Not available to team members'}
                    </p>
                    <button
                      onClick={() => handleToggleIntegration(integrationType, isEnabled)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: isEnabled ? '#f56565' : '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {isEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              Invite User to Organization
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#718096',
              marginBottom: '24px'
            }}>
              Send an invitation email to add a new team member.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'org_admin' | 'member')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="member">Member</option>
                <option value="org_admin">Organization Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('member');
                }}
                disabled={inviteLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: inviteLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                disabled={inviteLoading || !inviteEmail}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: inviteLoading || !inviteEmail ? '#a0aec0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: inviteLoading || !inviteEmail ? 'not-allowed' : 'pointer'
                }}
              >
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

