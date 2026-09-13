import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

// Use Outfit for a highly modern, geometric look
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Pothole Reporting System",
  description: "AI-powered civic hazard reporting network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} min-h-screen flex flex-col selection:bg-blue-500/30 text-gray-900 pt-16`}>
        <Providers>
          <Navbar />
          <main className="flex-1 w-full h-full flex flex-col animate-in fade-in duration-700">
            {children}
          </main>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: 'text-sm font-medium',
              style: {
                borderRadius: '16px',
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
