"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { ChevronDownIcon, UserIcon, LogOutIcon, SettingsIcon } from "lucide-react";

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Scroll detection for header transparency effects
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

  // Listen for custom payment success event
  useEffect(() => {
    const handlePaymentSuccess = () => {
      console.log('Payment success detected, refreshing credits...');
      // Will implement subscription refresh later when needed
    };
    
    window.addEventListener('payment-success', handlePaymentSuccess);
    
    return () => {
      window.removeEventListener('payment-success', handlePaymentSuccess);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    
    // Try to get full name from metadata
    if (user.user_metadata?.firstName && user.user_metadata?.lastName) {
      return `${user.user_metadata.firstName} ${user.user_metadata.lastName}`;
    }
    
    // Try to get first name only
    if (user.user_metadata?.firstName) {
      return user.user_metadata.firstName;
    }
    
    // Fallback to email username
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user) return 'G';
    
    const displayName = getUserDisplayName();
    if (displayName === 'Guest') return 'G';
    
    return displayName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Navigation items for authenticated users
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/premium", label: "Premium" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  // Calculate credit display
  const getCreditDisplay = () => {
    if (loading) {
      return (
        <div className="hidden md:flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full">
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      );
    }

    if (!subscription || !subscription.interview_time_remaining) {
      return (
        <div className="hidden md:flex items-center space-x-2 bg-red-50 px-3 py-1.5 rounded-full">
          <span className="text-red-600 text-sm font-medium">💳 $0.00</span>
          <span className="text-red-500 text-xs">No credits</span>
        </div>
      );
    }

    const creditAmount = (subscription.interview_time_remaining * 0.12).toFixed(2);
    const timeRemaining = subscription.interview_time_remaining;

    return (
      <div className="hidden md:flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
        <span className="text-green-600 text-sm font-medium">💳 ${creditAmount}</span>
        <span className="text-green-500 text-xs">{timeRemaining}m left</span>
        <button 
          onClick={() => window.location.reload()}
          className="ml-1 text-green-500 hover:text-green-700 transition-colors"
          title="Refresh credits"
        >
          🔄
        </button>
      </div>
    );
  };

  return (
    <nav className={`
      border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 ease-in-out
      ${isScrollingUp 
        ? 'bg-white/80 backdrop-blur-md' 
        : 'bg-white/95'
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎯</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#1E2B3A]">JasTalk AI</span>
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

          {/* Right side - User info and credits */}
          <div className="flex items-center space-x-4">
            {/* Credit Balance */}
            {getCreditDisplay()}
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">🇺🇸 English</span>
            </div>
            
            {/* User profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-[#4F46E5] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {getUserDisplayName()}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  
                  <Link
                    href="/premium"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Premium
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navigation; 
