'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type TabType = 'home' | 'context' | 'integrations';
type ActionType = 'analyze' | 'email';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [emailContext, setEmailContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Context state
  const [aboutMe, setAboutMe] = useState('');
  const [objectives, setObjectives] = useState('');
  const [contextLoading, setContextLoading] = useState(false);
  const [contextMessage, setContextMessage] = useState('');
  
  // Stats
  const [userStats, setUserStats] = useState<any>(null);
  const [integrations, setIntegrations] = useState<string[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    // Check initial auth state
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkAuth();
      } else {
        setIsAuthenticated(false);
        setUserData(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsAuthenticated(false);
      setUserData(null);
      return;
    }

    // Check if user exists in our users table and get their org info
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, role, organizations(id, name, account_type)')
      .eq('id', session.user.id)
      .single();

    // Only authenticate if user exists in our database
    if (error || !user) {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserData(null);
    } else {
      setIsAuthenticated(true);
      setUserData(user);
      // Load additional data
      loadUserContext(session.user.id);
      loadUserStats();
      loadIntegrations();
    }
  }

  async function loadUserContext(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('user_context')
      .eq('id', userId)
      .single();
    
    if (data?.user_context) {
      setAboutMe(data.user_context.aboutMe || '');
      setObjectives(data.user_context.objectives || '');
    }
  }

  async function loadUserStats() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch('/api/user/stats', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setUserStats(data);
    }
  }

  async function loadIntegrations() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch('/api/organization/integrations', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setIntegrations(data.enabledIntegrations || []);
    }
  }

  async function handleSaveContext() {
    setContextLoading(true);
    setContextMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setContextMessage('Please log in first');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          user_context: { aboutMe, objectives } 
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setContextMessage('✓ Context saved successfully!');
      setTimeout(() => setContextMessage(''), 3000);
    } catch (err: any) {
      setContextMessage('Error saving context: ' + err.message);
    } finally {
      setContextLoading(false);
    }
  }

  async function handleAnalyzeOrDraft() {
    if (!linkedinUrl.trim()) {
      setError('Please enter a LinkedIn URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in first');
        return;
      }

      // Call prospects API
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          linkedinUrl,
          action: actionType,
          userContext: { aboutMe, objectives },
          emailContext: actionType === 'email' ? emailContext : undefined,
          profileData: {
            // We don't have scraped data, so just use URL
            name: 'LinkedIn Profile',
            fullPageText: `LinkedIn profile: ${linkedinUrl}`
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.analysis) {
        setResult({
          analysis: data.analysis,
          profileData: data.profileData
        });
        // Reload stats
        loadUserStats();
      } else {
        setError(data.error || 'Failed to analyze profile');
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    supabase.auth.signOut();
    router.push('/login');
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </main>
    );
  }

  // Not authenticated - show landing page
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="relative isolate overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-[80rem] rounded-full bg-gradient-to-r from-indigo-600/20 to-purple-600/10 blur-3xl" />
          </div>

          {/* Hero Section */}
          <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/20 mb-8">
                AI-Powered Sales Intelligence
              </span>
              
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
                Sales Curiosity
              </h1>
              
              <p className="text-xl text-slate-300 mb-12 leading-relaxed">
                Transform LinkedIn profiles into actionable insights and personalized outreach emails. 
                Save hours of research and close more deals with AI-powered intelligence.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-105"
                >
                  Get Started Free
                </Link>
                <Link 
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-700 transition-all hover:border-slate-600"
                >
                  Sign In
                </Link>
              </div>

              {/* Features Grid */}
              <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-400 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Instant Analysis</h3>
                  <p className="text-sm text-slate-400">
                    Analyze LinkedIn profiles in seconds with AI-powered insights
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 text-purple-400 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Smart Emails</h3>
                  <p className="text-sm text-slate-400">
                    Generate personalized outreach emails that get responses
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 text-cyan-400 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Team Management</h3>
                  <p className="text-sm text-slate-400">
                    Manage your team and track all activity from one dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated - show app features
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[80rem] rounded-full bg-gradient-to-r from-indigo-600/20 to-purple-600/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="flex flex-col items-start gap-4 sm:gap-6">
            <div className="w-full">
              {/* Account Type Badge */}
              {userData?.organizations?.account_type === 'individual' ? (
                <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/20">
                  👤 Personal Workspace
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 ring-1 ring-inset ring-purple-500/20">
                    🏢 {userData?.organizations?.name}
                  </span>
                  {userData?.role === 'org_admin' && (
                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-bold text-indigo-300 ring-1 ring-inset ring-indigo-500/20">
                      ADMIN
                    </span>
                  )}
                  {userData?.role === 'member' && (
                    <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-500/20">
                      Member
              </span>
                  )}
                </div>
              )}
              <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
                Sales Curiosity
              </h1>
              <p className="mt-2 max-w-xl text-xs sm:text-sm text-slate-400">
                {userData?.organizations?.account_type === 'individual' 
                  ? 'Craft compelling outreach with LinkedIn context and your voice.'
                  : `Team workspace for ${userData?.organizations?.name}. Collaborate and track team activity.`
                }
              </p>
            </div>
            {/* Admin Dashboard Link */}
            {(userData?.role === 'org_admin' || userData?.role === 'super_admin') && (
              <Link 
                href="/admin/organization"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:scale-105"
              >
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Organization Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Tabs - Mobile Responsive */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:gap-6 border-b border-slate-800">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto">
            {(['home', 'context', 'integrations'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError('');
                  setResult(null);
                  setActionType(null);
                }}
                className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-indigo-500 text-indigo-400'
                    : 'border-b-2 border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="hidden sm:inline">{tab === 'home' && '🏠 '} {tab === 'context' && '👤 '} {tab === 'integrations' && '🔌 '}</span>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs sm:text-sm text-slate-400 hover:text-slate-300 transition self-end sm:self-auto"
          >
            Logout
          </button>
        </div>
      </section>

      {/* Tab Content - Mobile Responsive */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 pb-12 sm:pb-16">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="max-w-4xl mx-auto">
            {/* Stats Card */}
            {userStats && !result && (
              <div className="mb-4 sm:mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl backdrop-blur">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                  {userStats.teamStats ? '📊 Team Activity' : '📈 Your Activity'}
                </h3>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                      {userStats.userStats?.analysesCount || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400">
                      Profile{userStats.userStats?.analysesCount === 1 ? '' : 's'} Analyzed
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4">
                    <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
                      {userStats.userStats?.emailsCount || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400">
                      Email{userStats.userStats?.emailsCount === 1 ? '' : 's'} Drafted
                    </div>
                  </div>
                </div>

                {userStats.teamStats && (
                  <div className="border-t border-slate-800 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <div className="text-xs sm:text-sm font-semibold text-slate-400 mb-2 sm:mb-3">Team Overview</div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-purple-400">{userStats.teamStats.activeMembers}</div>
                        <div className="text-xs text-slate-500">Member{userStats.teamStats.activeMembers === 1 ? '' : 's'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-400">{userStats.teamStats.totalAnalyses}</div>
                        <div className="text-xs text-slate-500">Analyses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-400">{userStats.teamStats.totalEmails}</div>
                        <div className="text-xs text-slate-500">Emails</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LinkedIn URL Input */}
            {!actionType && !result && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl backdrop-blur">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">LinkedIn Profile Analysis</h2>
                <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
                  Enter a LinkedIn profile URL to analyze with AI or draft a personalized email.
                </p>
                
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/username"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setActionType('analyze')}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30"
                  >
                    🔍 Analyze Profile
                  </button>
                  <button
                    onClick={() => setActionType('email')}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
                  >
                    ✉️ Draft Email
                  </button>
                </div>
              </div>
            )}

            {/* Email Context Input */}
            {actionType === 'email' && !result && (
              <div className="mt-4 sm:mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl backdrop-blur">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Email Context (Optional)</h3>
                <textarea
                  value={emailContext}
                  onChange={(e) => setEmailContext(e.target.value)}
                  placeholder="Add specific context about how you'd like to approach this email..."
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={handleAnalyzeOrDraft}
                    disabled={loading}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Drafting...' : 'Generate Email'}
                  </button>
                  <button
                    onClick={() => {
                      setActionType(null);
                      setEmailContext('');
                    }}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 text-slate-300 text-sm sm:text-base font-semibold rounded-lg hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Analyze Confirmation */}
            {actionType === 'analyze' && !result && (
              <div className="mt-4 sm:mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl backdrop-blur">
                <p className="text-xs sm:text-sm text-slate-300 mb-4">
                  Ready to analyze this LinkedIn profile with AI insights?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAnalyzeOrDraft}
                    disabled={loading}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Analyzing...' : 'Start Analysis'}
                  </button>
                  <button
                    onClick={() => setActionType(null)}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 text-slate-300 text-sm sm:text-base font-semibold rounded-lg hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 sm:mt-6 rounded-xl border border-red-800 bg-red-900/20 p-3 sm:p-4">
                <p className="text-red-400 text-xs sm:text-sm">❌ {error}</p>
              </div>
            )}

            {/* Results Display */}
            {result && (
              <div className="mt-4 sm:mt-6 rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl backdrop-blur">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 sm:p-4 flex justify-between items-center">
                  <h3 className="text-white text-sm sm:text-base font-semibold">✨ AI Results</h3>
                  <button
                    onClick={() => {
                      setResult(null);
                      setActionType(null);
                      setLinkedinUrl('');
                      setEmailContext('');
                    }}
                    className="text-white/80 hover:text-white transition text-lg sm:text-xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4 sm:p-6 text-slate-300 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed max-h-96 overflow-y-auto">
                  {result.analysis}
                </div>
              </div>
            )}

            {/* Extension Download CTA */}
            <div className="mt-6 sm:mt-8 rounded-xl border border-indigo-800 bg-indigo-900/20 p-4 sm:p-6 shadow-xl backdrop-blur">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="text-3xl sm:text-4xl">🚀</div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Get the Chrome Extension</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mb-4">
                    Analyze LinkedIn profiles directly from any profile page. No copy-pasting URLs needed!
                  </p>
                  <Link
                    href="/install"
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
                  >
                    Download Extension
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Context Tab - Mobile Responsive */}
        {activeTab === 'context' && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl backdrop-blur">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2">Your Context</h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-6">
                This information will be used to personalize AI-generated analyses and emails.
              </p>

              {contextMessage && (
                <div className={`mb-4 p-3 rounded-lg text-xs sm:text-sm ${
                  contextMessage.includes('✓')
                    ? 'bg-green-900/20 border border-green-800 text-green-400'
                    : 'bg-red-900/20 border border-red-800 text-red-400'
                }`}>
                  {contextMessage}
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">About Me</label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Describe your role, company, and what you do..."
                  rows={5}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">My Objectives</label>
                <textarea
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="What are your sales goals and what you're looking to achieve..."
                  rows={5}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={handleSaveContext}
                disabled={contextLoading}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {contextLoading ? 'Saving...' : 'Save Context'}
              </button>
            </div>
          </div>
        )}

        {/* Integrations Tab - Mobile Responsive */}
        {activeTab === 'integrations' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl backdrop-blur mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2">Integrations</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {userData?.organizations?.account_type === 'individual'
                  ? 'Connect your tools to streamline your workflow.'
                  : userData?.role === 'org_admin'
                  ? 'Manage integrations for your organization from the admin dashboard.'
                  : 'Your organization admin manages which integrations are available to your team.'}
              </p>
            </div>

            {/* Admin Link */}
            {userData?.role === 'org_admin' && (
              <div className="mb-4 sm:mb-6 rounded-xl border border-blue-800 bg-blue-900/20 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs sm:text-sm text-blue-300">Enable integrations for your team</span>
                <Link
                  href="/admin/organization"
                  className="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-xs sm:text-sm"
                >
                  Open Dashboard
                </Link>
              </div>
            )}

            {/* Org member status */}
            {userData?.organizations?.account_type === 'organization' && userData?.role !== 'org_admin' && (
              <>
                {integrations.length > 0 ? (
                  <div className="mb-4 sm:mb-6 rounded-xl border border-green-800 bg-green-900/20 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-green-300">
                      ✓ Your organization has <strong>{integrations.length}</strong> integration{integrations.length !== 1 ? 's' : ''} enabled: {integrations.join(', ')}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 sm:mb-6 rounded-xl border border-yellow-800 bg-yellow-900/20 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-yellow-300">
                      No integrations enabled yet. Ask your organization admin to enable integrations.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Integration cards for individual users */}
            {userData?.organizations?.account_type === 'individual' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl backdrop-blur">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="text-3xl sm:text-4xl">📧</div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">Email Integration</h3>
                      <p className="text-xs text-slate-400">Gmail, Outlook, and more</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
                    Send drafted emails directly to your email client.
                  </p>
                  <div className="inline-block px-3 py-1 bg-yellow-900/20 border border-yellow-800 rounded text-yellow-400 text-xs font-semibold">
                    Coming Soon
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-xl backdrop-blur">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="text-3xl sm:text-4xl">🔗</div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">CRM Integration</h3>
                      <p className="text-xs text-slate-400">Salesforce, HubSpot, and more</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
                    Automatically sync profiles and activities to your CRM.
                  </p>
                  <div className="inline-block px-3 py-1 bg-yellow-900/20 border border-yellow-800 rounded text-yellow-400 text-xs font-semibold">
                    Coming Soon
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}


