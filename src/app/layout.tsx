import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Github } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lnkz.my | URL Shortener",
  description:
    "Simple and elegant URL shortening service. Make your links shorter and more shareable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-4">
          <a
            href="https://github.com/Fz77z/lnkz.my"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            Star on GitHub
          </a>
          <a
            href="https://ko-fi.com/kanerkt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path
                d="M7.22 11.89C7.22 11.89 7.21 11.89 7.22 11.89ZM23 11.89C23 11.89 23 11.89 23 11.89L23 11.89ZM18.5 11.89C18.5 11.89 18.5 11.89 18.5 11.89L18.5 11.89ZM7.22 11.89L18.5 11.89M18.5 11.89L23 11.89M7.22 11.89L1 11.89M18.5 11.89C18.5 7.99 15.34 4.83 11.44 4.83C7.53 4.83 4.37 7.99 4.37 11.89C4.37 15.79 7.53 18.95 11.44 18.95C15.34 18.95 18.5 15.79 18.5 11.89Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Buy me a coffee!
          </a>
        </div>

        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
