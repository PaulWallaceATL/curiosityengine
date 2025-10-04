'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import EmailDrafter from "@/components/EmailDrafter";
import TaskQuickCreate from "@/components/TaskQuickCreate";
import Link from 'next/link';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
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
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/20">
                Workspace
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Sales Curiosity
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Craft compelling outreach with LinkedIn context and your voice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Drafter */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur transition hover:border-slate-700">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Draft personalized email from LinkedIn</h2>
              <span className="text-xs text-slate-500 font-medium">AI-assisted</span>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Paste a LinkedIn profile URL and describe your personal context. We'll enrich with profile details when possible.
            </p>
            <EmailDrafter />
          </div>

          {/* Quick task */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur transition hover:border-slate-700">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Quick task</h2>
              <span className="text-xs text-slate-500 font-medium">Dashboard sync</span>
            </div>
            <TaskQuickCreate />
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Tasks appear instantly in your Admin workspace. Use this for research, briefings, and email tasks.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}


