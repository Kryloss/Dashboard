import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { SubdomainLayout } from "@/components/subdomain-layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kryloss - Productivity Platform Dashboard",
  description: "Centralized hub for powerful productivity tools. Access health tracking, notifications, and more from one unified dashboard.",
  keywords: ["productivity", "dashboard", "health tracking", "notifications", "tools"],
  authors: [{ name: "Kryloss" }],
  creator: "Kryloss",
  publisher: "Kryloss",
  metadataBase: new URL("https://kryloss.com"),
  openGraph: {
    title: "Kryloss - Productivity Platform Dashboard",
    description: "Centralized hub for powerful productivity tools. Access health tracking, notifications, and more from one unified dashboard.",
    url: "https://kryloss.com",
    siteName: "Kryloss",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kryloss - Productivity Platform Dashboard",
    description: "Centralized hub for powerful productivity tools. Access health tracking, notifications, and more from one unified dashboard.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0B0C0D] text-[#FBF7FA]`}>
        <AuthProvider>
          <SubdomainLayout>{children}</SubdomainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
