import React from "react";
import Navigation from "@/components/Navigation";

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      <div className="pb-24 md:pb-0">
        {children}
      </div>
    </div>
  );
}
