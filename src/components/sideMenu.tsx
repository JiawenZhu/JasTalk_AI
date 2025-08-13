"use client";

import React, { useEffect, useState } from "react";
import { PlayCircle, Users, Settings, Home, UserPlus, CreditCard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";

function SideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Temporarily disable subscription fetching to prevent infinite loop
  // Will re-enable once the database schema is properly set up

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
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Billing</span>
                </div>
                
                {/* Credit Balance */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Credits</span>
                    <span className="text-sm font-bold text-green-600">
                      ${subscription?.interview_time_remaining ? (subscription.interview_time_remaining * 0.12).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Time</span>
                    <span className="text-xs text-gray-700">
                      {subscription?.interview_time_remaining || 0} min
                    </span>
                  </div>
                </div>
                
                {/* Rate Info */}
                <div className="text-xs text-gray-600 mb-3">
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="font-medium">$0.12/min</span>
                  </div>
                </div>
                
                {/* Buy Credits Button */}
                <button
                  onClick={() => router.push('/premium')}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Buy Credits
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Hide Home and Interviewers on sign-up page */}
              {!pathname.includes("/sign-up") && (
                <>
                  <button
                    className={`flex flex-row items-center p-3 rounded-md hover:bg-slate-200 cursor-pointer transition-all duration-200 text-left w-full ${
                      pathname === "/"
                        ? "bg-indigo-200 shadow-sm"
                        : "bg-slate-100"
                    } ${navigating ? "opacity-75" : "opacity-100"}`}
                    disabled={navigating}
                    aria-label="Navigate to Home"
                    aria-current={pathname === "/" ? "page" : undefined}
                    onClick={() => handleNavigation("/")}
                  >
                    <Home 
                      className="font-thin mr-2 transition-transform duration-200" 
                      size={20} 
                      style={{ transform: navigating ? 'scale(0.95)' : 'scale(1)' }}
                    />
                    <span className="font-medium">Home</span>
                  </button>
                  <button
                    className={`flex flex-row items-center p-3 rounded-md hover:bg-slate-200 cursor-pointer transition-all duration-200 text-left w-full ${
                      pathname.includes("/interview/select")
                        ? "bg-indigo-200 shadow-sm"
                        : "bg-slate-100"
                    } ${navigating ? "opacity-75" : "opacity-100"}`}
                    disabled={navigating}
                    aria-label="Navigate to Interviewers"
                    aria-current={pathname.includes("/interview/select") ? "page" : undefined}
                    onClick={() => handleNavigation("/interview/select")}
                  >
                    <Users 
                      className="font-thin mr-2 transition-transform duration-200" 
                      size={20}
                      style={{ transform: navigating ? 'scale(0.95)' : 'scale(1)' }}
                    />
                    <span className="font-medium">Interviewers</span>
                  </button>
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
