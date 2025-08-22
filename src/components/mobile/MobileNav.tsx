"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Shield, CreditCard } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreditsDisplay from "@/components/CreditsDisplay";

const items = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/dashboard/interviewers", label: "Interviewers", Icon: Users },
  { href: "/admin", label: "Admin", Icon: Shield },
  { href: "/premium", label: "Billing", Icon: CreditCard },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  // Scroll detection for transparency effects
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < lastScrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      
      // Only update state if there's significant scroll movement
      if (scrollDelta > 5) {
        setIsScrollingUp(scrollingUp);
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={`
      sm:hidden fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-in-out
      ${isScrollingUp 
        ? 'bg-white/80 backdrop-blur-md border-t border-gray-300' 
        : 'bg-white/95 border-t border-gray-200'
      }
      supports-[backdrop-filter]:bg-white/60
    `}
    style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: 'block'
    }}
    >
      {/* Scroll Direction Indicator */}
      <div className={`
        absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 rounded-full transition-all duration-300
        ${isScrollingUp ? 'bg-indigo-400/60' : 'bg-gray-400/40'}
      `} />
      
      {/* Credit Balance Indicator - Using new CreditsDisplay component */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50/80">
        <CreditsDisplay variant="compact" className="text-xs" />
      </div>
      
      <ul className="flex items-center justify-around py-2">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
          return (
            <li key={href}>
              <Link href={href} className="flex flex-col items-center gap-1 px-3 py-1">
                <Icon className={`h-5 w-5 ${active ? "text-indigo-600" : "text-gray-500"}`} />
                <span className={`text-[11px] ${active ? "text-indigo-600" : "text-gray-500"}`}>{label}</span>
              </Link>
            </li>
          );
        })}
        
        {/* Small help icon docked into the mobile nav */}
        <li>
          <button
            aria-label="Help"
            onClick={() => {
              // Dispatch a custom event so the global HelpButton can open its modal
              document.dispatchEvent(new CustomEvent('open-help-modal'));
            }}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[11px]">?</span>
            <span className="text-[11px] text-gray-500">Help</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}


