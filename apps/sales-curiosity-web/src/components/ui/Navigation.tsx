'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UserData {
  role: 'super_admin' | 'org_admin' | 'member';
  organization_id: string;
}

export default function Navigation() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await checkUser();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data, error } = await supabase
          .from('users')
          .select('role, organization_id')
          .eq('id', session.user.id)
          .single();
        
        // If user doesn't exist in our database, sign them out
        if (error || !data) {
          await supabase.auth.signOut();
          setUserData(null);
        } else {
          setUserData(data as UserData);
        }
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      await supabase.auth.signOut();
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserData(null);
    window.location.href = '/';
  }

  const showOrgAdmin = userData?.role === 'org_admin' || userData?.role === 'super_admin';
  const isAuthenticated = userData !== null;

  return (
    <nav className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-medium">
          Sales Curiosity
        </Link>
        
        <div className="flex items-center gap-4 text-sm">
          <Link className="opacity-80 hover:opacity-100" href="/">
            Home
          </Link>
          
          {/* Show org admin link only for org_admin and super_admin */}
          {showOrgAdmin && (
            <Link 
              className="opacity-80 hover:opacity-100" 
              href="/admin/organization"
            >
              Organization
            </Link>
          )}
          
          {/* Auth buttons */}
          {loading ? (
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          ) : isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              Logout
            </button>
          ) : (
            <>
              <Link 
                className="opacity-80 hover:opacity-100" 
                href="/login"
              >
                Login
              </Link>
              <Link 
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                href="/signup"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

