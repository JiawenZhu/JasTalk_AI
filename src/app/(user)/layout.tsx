import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JasTalk AI",
  description: "AI-Powered Interview Practice",
  openGraph: {
    title: "JasTalk AI",
    description: "AI-Powered Interview Practice",
    siteName: "JasTalk AI",
    images: [
      {
        url: "/jastalk.png",
        width: 1200,
        height: 630,
        alt: "JasTalk AI",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/browser-user-icon.ico" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            toastOptions={{
              classNames: {
                toast: "bg-white border-2 border-indigo-400",
                title: "text-black",
                description: "text-red-400",
                actionButton: "bg-indigo-400",
                cancelButton: "bg-orange-400",
                closeButton: "bg-lime-400",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
