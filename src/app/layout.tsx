import React from "react";
import "./globals.css";
import { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import Providers from '@/components/providers';
import Pixels from '@/components/analytics/Pixels';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import MobileNav from '@/components/mobile/MobileNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "JasTalk AI — AI-Powered Interview Practice",
  description: "Practice for your next job interview with AI-powered mock interviews, personalized feedback, and comprehensive analytics",
  openGraph: {
    title: "JasTalk AI — AI-Powered Interview Practice",
    description: "Practice for your next job interview with AI-powered mock interviews, personalized feedback, and comprehensive analytics",
    url: "https://jastalk.ai",
    siteName: "JasTalk AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JasTalk AI — AI-Powered Interview Practice",
    description: "Practice for your next job interview with AI-powered mock interviews, personalized feedback, and comprehensive analytics",
  },
  metadataBase: new URL("https://jastalk.ai"),
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
};

// Force dynamic rendering globally to avoid prerendering API-dependent routes during build
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Pixels 
          gaId={process.env.GA_ID}
          metaPixelId={process.env.META_PIXEL_ID}
          linkedinPartnerId={process.env.LINKEDIN_PARTNER_ID}
          tiktokPixelId={process.env.TIKTOK_PIXEL_ID}
        />
        <Providers>
          <main className="min-h-screen bg-[#F7F9FC] pb-14 sm:pb-0">
            {children}
          </main>
          {/* Mobile bottom nav (hidden on desktop) */}
          <div className="sm:hidden">
            <MobileNav />
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
} 
