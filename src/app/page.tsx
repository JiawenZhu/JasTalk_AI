"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";

export const dynamic = 'force-dynamic';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading) {
      setRedirecting(true);
      
      if (isAuthenticated) {
        // If user is authenticated, redirect to dashboard
        console.log('User is authenticated, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        // If user is not authenticated, redirect to landing page
        console.log('User is not authenticated, redirecting to landing page');
        router.push('/jastalk-landing');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {loading ? 'Checking authentication...' : redirecting ? 'Redirecting...' : 'Loading...'}
        </p>
        {!loading && !redirecting && (
          <p className="mt-2 text-sm text-gray-500">
            {isAuthenticated ? 'Taking you to dashboard...' : 'Taking you to landing page...'}
          </p>
        )}
      </div>
    </div>
  );
}
