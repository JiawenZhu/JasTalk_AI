import React from "react";
import "./globals.css";
import { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import Providers from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Premium Interview — AI-Powered Practice",
  description: "Practice for your next job interview with AI-powered mock interviews, personalized feedback, and comprehensive analytics",
  openGraph: {
    title: "Premium Interview — AI-Powered Practice",
    description: "Practice for your next job interview with AI-powered mock interviews, personalized feedback, and comprehensive analytics",
    url: "https://foloup.com",
    siteName: "Premium Interview",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Interview — AI-Powered Practice",
    description: "Practice for your next job interview with AI-powered mock interviews, personalized feedback, and comprehensive analytics",
  },
  metadataBase: new URL("https://foloup.com"),
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
};

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
        <Providers>
          <main className="min-h-screen bg-[#F7F9FC]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
} 
