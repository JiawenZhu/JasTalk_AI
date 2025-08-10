"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Shield } from "lucide-react";
import React from "react";

const items = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/dashboard/interviewers", label: "Interviewers", Icon: Users },
  { href: "/admin", label: "Admin", Icon: Shield },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
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


