"use client";

import "../globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";
import Providers from "@/components/providers";
import { Toaster } from "sonner";
import SideMenu from "@/components/sideMenu";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { useOrganization } from "@/contexts/organization.context";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading: authLoading } = useAuth();
  const { loading: orgLoading } = useOrganization();
  const [layoutReady, setLayoutReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  const isAuthPage = pathname.includes("/sign-in") || pathname.includes("/sign-up");
  const isLoading = !isAuthPage && (authLoading || orgLoading);

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
      {!isAuthPage && <Navbar />}
      <div className="flex flex-row h-screen">
        {!isAuthPage && <SideMenu />}
        
        {/* Content area with smooth transitions */}
        <div className={cn(
          "pt-[64px] h-full overflow-y-auto flex-grow transition-opacity duration-200",
          !isAuthPage ? "ml-[200px] navigation-offset" : "",
          contentVisible ? "opacity-100" : "opacity-0"
        )}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className={cn(
              "transition-all duration-200 ease-in-out",
              contentVisible ? "transform translate-y-0" : "transform translate-y-2"
            )}>
              {children}
            </div>
          )}
        </div>
      </div>
      
      <Toaster
        toastOptions={{
          classNames: {
            toast: "bg-white",
            title: "text-black",
            description: "text-red-400",
            actionButton: "bg-indigo-400",
            cancelButton: "bg-orange-400",
            closeButton: "bg-white-400",
          },
        }}
      />
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
