"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/demo", label: "Demo" },
    { href: "/premium", label: "Premium" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎯</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#1E2B3A]">Premium Interview</span>
                <span className="text-xs text-gray-500 -mt-1">AI-Powered Practice</span>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full ml-2">
                Beta
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? "text-[#4F46E5] border-b-2 border-[#4F46E5] pb-1"
                    : "text-gray-600 hover:text-[#1E2B3A]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">🇺🇸 English</span>
            </div>
            {/* Placeholder for user authentication - replace with actual auth when ready */}
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">👤</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 