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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Not authenticated - redirect to login
      router.push('/login');
      return;
    }

    // Get user's role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Redirect based on role
    if (userData?.role === 'org_admin' || userData?.role === 'super_admin') {
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

