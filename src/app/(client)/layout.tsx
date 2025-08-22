"use client";

import "../globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import SideMenu from "@/components/sideMenu";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { useEffect, useState } from "react";
import HelpButton from "@/components/ui/help-button";
import WelcomeModal from "@/components/onboarding/welcome-modal";
import { useOnboarding } from "@/hooks/use-onboarding";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading: authLoading } = useAuth();
  const [layoutReady, setLayoutReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const { 
    isFirstTime, 
    showOnboarding, 
    hideOnboardingModal 
  } = useOnboarding();

  const isAuthPage = pathname.includes("/sign-in") || pathname.includes("/sign-up") || pathname.includes("/forgot-password");
  const isLoading = !isAuthPage && authLoading;

  useEffect(() => {
    if (!isLoading) {
      // Ensure layout is ready before showing content
      setLayoutReady(true);
      // Small delay to ensure navigation renders first
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Reset visibility on route changes
  useEffect(() => {
    setContentVisible(false);
    const timer = setTimeout(() => {
      if (layoutReady && !isLoading) {
        setContentVisible(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname, layoutReady, isLoading]);

  return (
    <div className="navigation-layer min-h-screen bg-[#F7F9FC]">
      <Navbar />
      <div className="flex flex-row h-screen">
        {!isAuthPage && (
          <div className="hidden sm:block">
            <SideMenu />
          </div>
        )}
        
        {/* Content area - simplified without problematic transitions */}
        <div className={`pt-[64px] h-full overflow-y-auto flex-grow ${!isAuthPage ? 'sm:ml-[200px]' : ''} navigation-offset`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div>
              {children}
            </div>
          )}
        </div>
      </div>
      
      {/* Help Button - show for all users */}
      <HelpButton 
        variant="floating" 
        position="bottom-right" 
        size="sm"
        className="hidden sm:flex" 
      />

      {/* Onboarding Modal */}
      <WelcomeModal
        isOpen={showOnboarding}
        isFirstTime={isFirstTime}
        onClose={hideOnboardingModal}
      />
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <LayoutContent>{children}</LayoutContent>
    </Providers>
  );
}
