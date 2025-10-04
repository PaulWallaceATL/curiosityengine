'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  async function checkAuthAndRedirect() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Not authenticated - redirect to login
      router.push('/login');
      return;
    }

    // Get user's role from our database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // If user doesn't exist in our database, sign out and redirect to signup
    if (error || !userData) {
      await supabase.auth.signOut();
      router.push('/signup');
      return;
    }

    // Redirect based on role
    if (userData.role === 'org_admin' || userData.role === 'super_admin') {
      router.push('/admin/organization');
    } else {
      router.push('/'); // Regular users go to home
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="animate-pulse text-slate-400">Redirecting...</div>
    </div>
  );
}

