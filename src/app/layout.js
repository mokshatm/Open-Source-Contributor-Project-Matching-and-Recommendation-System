import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OS Matcher — Contributor Recommendation System",
  description:
    "An intentional, research-driven matching system for open-source contributors based on NLP requirement extraction and content-based ranking.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[#0e0e10] text-[#ededef] flex flex-row">
        {/* Persistent Linear-inspired sidebar */}
        <Sidebar />

        {/* Content Shell */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 px-6 sm:px-8 py-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
