"use client";

import React, { useEffect, useState } from "react";
import { PlayCircle, Users, Settings, Home, UserPlus, CreditCard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import Link from "next/link";
import { HomeIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import CreditsDisplay from "@/components/CreditsDisplay";

function SideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [navigating, setNavigating] = useState(false);
  // Credit display now handled by CreditsDisplay component

  useEffect(() => {
    setMounted(true);
  }, []);

  // Credit updates now handled by CreditsDisplay component

  const handleNavigation = (path: string) => {
    if (pathname === path) {return;}
    
    setNavigating(true);
    router.push(path);
    
    // Reset navigating state after a brief delay
    setTimeout(() => {
      setNavigating(false);
    }, 200);
  };

  // Render immediately to prevent layout shifts
  return (
    <aside 
      className="hidden sm:block z-[1000] bg-slate-100 p-6 w-[200px] fixed top-[64px] left-0 h-[calc(100vh-64px)] border-r border-gray-200 shadow-sm"
      style={{ 
        position: 'fixed',
        top: '64px',
        left: '0',
        width: '200px',
        height: 'calc(100vh - 64px)',
        zIndex: 1000,
        backgroundColor: '#f1f5f9',
        display: 'block',
        visibility: 'visible',
        // Hardware acceleration for smooth rendering
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform'
      }}
    >
      <nav className="flex flex-col gap-1" role="navigation" aria-label="Main navigation">
        <div className="flex flex-col justify-between gap-2">
          {isAuthenticated ? (
            <>
              <button
                className={`flex flex-row items-center p-3 rounded-md hover:bg-slate-200 cursor-pointer transition-all duration-200 text-left w-full ${
                  pathname.endsWith("/dashboard") ||
                  pathname.includes("/interviews")
                    ? "bg-indigo-200 shadow-sm"
                    : "bg-slate-100"
                } ${navigating ? "opacity-75" : "opacity-100"}`}
                disabled={navigating}
                aria-label="Navigate to Interviews"
                aria-current={pathname.endsWith("/dashboard") || pathname.includes("/interviews") ? "page" : undefined}
                onClick={() => handleNavigation("/dashboard")}
              >
                <PlayCircle 
                  className="font-thin mr-2 transition-transform duration-200" 
                  size={20} 
                  style={{ transform: navigating ? 'scale(0.95)' : 'scale(1)' }}
                />
                <span className="font-medium">Interviews</span>
              </button>
              
              <button
                className={`flex flex-row items-center p-3 rounded-md hover:bg-slate-200 cursor-pointer transition-all duration-200 text-left w-full ${
                  pathname.endsWith("/interviewers")
                    ? "bg-indigo-200 shadow-sm"
                    : "bg-slate-100"
                } ${navigating ? "opacity-75" : "opacity-100"}`}
                disabled={navigating}
                aria-label="Navigate to Interviewers"
                aria-current={pathname.endsWith("/interviewers") ? "page" : undefined}
                onClick={() => handleNavigation("/dashboard/interviewers")}
              >
                <Users 
                  className="font-thin mr-2 transition-transform duration-200" 
                  size={20}
                  style={{ transform: navigating ? 'scale(0.95)' : 'scale(1)' }}
                />
                <span className="font-medium">Interviewers</span>
              </button>
              <button
                className={`flex flex-row items-center p-3 rounded-md hover:bg-slate-200 cursor-pointer transition-all duration-200 text-left w-full ${
                  pathname.endsWith("/admin")
                    ? "bg-indigo-200 shadow-sm"
                    : "bg-slate-100"
                } ${navigating ? "opacity-75" : "opacity-100"}`}
                disabled={navigating}
                aria-label="Navigate to Admin"
                aria-current={pathname.endsWith("/admin") ? "page" : undefined}
                onClick={() => handleNavigation("/dashboard/admin")}
              >
                <Settings 
                  className="font-thin mr-2 transition-transform duration-200" 
                  size={20}
                  style={{ transform: navigating ? 'scale(0.95)' : 'scale(1)' }}
                />
                <span className="font-medium">Admin</span>
              </button>
              <button
                className={`flex flex-row items-center p-3 rounded-md hover:bg-slate-200 cursor-pointer transition-all duration-200 text-left w-full ${
                  pathname.endsWith("/billing")
                    ? "bg-indigo-200 shadow-sm"
                    : "bg-slate-100"
                } ${navigating ? "opacity-75" : "opacity-100"}`}
                disabled={navigating}
                aria-label="Navigate to Billing"
                aria-current={pathname.endsWith("/billing") ? "page" : undefined}
                onClick={() => handleNavigation("/dashboard/billing")}
              >
                <CreditCard 
                  className="font-thin mr-2 transition-transform duration-200" 
                  size={20}
                  style={{ transform: navigating ? 'scale(0.95)' : 'scale(1)' }}
                />
                <span className="font-medium">Billing</span>
              </button>
              
              {/* Billing Section */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Account Credits</span>
                </div>
                
                {/* Credit Balance - Clean Design */}
                <div className="mb-4">
                  <CreditsDisplay variant="detailed" className="w-full" />
                </div>
                
                {/* Buy Credits Button */}
                <button
                  onClick={() => router.push('/premium')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>💳</span>
                    <span>Get More Credits</span>
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Hide Home and Interviewers on sign-up page */}
              {!pathname.includes("/sign-up") && (
                <>
                  <Link
                    href="/"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      pathname === '/'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <HomeIcon className="w-5 h-5" />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/progress"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      pathname === '/progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Progress</span>
                  </Link>

                </>
              )}
              <button
                className={`flex flex-row items-center p-3 rounded-md hover:bg-slate-200 cursor-pointer transition-all duration-200 text-left w-full ${
                  pathname.includes("/demo")
                    ? "bg-indigo-200 shadow-sm"
                    : "bg-slate-100"
                } ${navigating ? "opacity-75" : "opacity-100"}`}
                disabled={navigating}
                aria-label="Navigate to Demo"
                aria-current={pathname.includes("/demo") ? "page" : undefined}
                onClick={() => handleNavigation("/demo")}
              >
                <PlayCircle 
                  className="font-thin mr-2 transition-transform duration-200" 
                  size={20}
                  style={{ transform: navigating ? 'scale(0.95)' : 'scale(1)' }}
                />
                <span className="font-medium">Demo</span>
              </button>
              <button
                className={`flex flex-row items-center p-3 rounded-md hover:bg-slate-200 cursor-pointer transition-all duration-200 text-left w-full ${
                  pathname.includes("/sign-in") || pathname.includes("/sign-up")
                    ? "bg-indigo-200 shadow-sm"
                    : "bg-slate-100"
                } ${navigating ? "opacity-75" : "opacity-100"}`}
                disabled={navigating}
                aria-label="Navigate to Sign In"
                aria-current={pathname.includes("/sign-in") || pathname.includes("/sign-up") ? "page" : undefined}
                onClick={() => handleNavigation("/sign-in")}
              >
                <UserPlus 
                  className="font-thin mr-2 transition-transform duration-200" 
                  size={20}
                  style={{ transform: navigating ? 'scale(0.95)' : 'scale(1)' }}
                />
                <span className="font-medium">Sign In</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </aside>
  );
}

export default SideMenu;
