"use client";

import React, { useEffect, useState } from "react";
import { PlayCircle, Users, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

function SideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      className="z-[1000] bg-slate-100 p-6 w-[200px] fixed top-[64px] left-0 h-[calc(100vh-64px)] border-r border-gray-200 shadow-sm"
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
        </div>
      </nav>
    </aside>
  );
}

export default SideMenu;
