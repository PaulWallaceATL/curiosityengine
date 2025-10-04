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

    try {
      // Get user's role from API (uses service role, bypasses RLS)
      const response = await fetch('/api/user/role', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to get user role:', data);
        await supabase.auth.signOut();
        router.push('/signup?message=Account setup incomplete. Please sign up again.');
        return;
      }

      const data = await response.json();

      // Redirect based on role
      if (data.role === 'org_admin' || data.role === 'super_admin') {
        router.push('/admin/organization');
      } else {
        router.push('/'); // Regular users go to home
      }
    } catch (err) {
      console.error('Error during redirect:', err);
      await supabase.auth.signOut();
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="animate-pulse text-slate-400">Redirecting...</div>
    </div>
  );
}

