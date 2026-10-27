import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mini Linear",
  description:
    "A lightweight issue tracker for small teams: organizations, projects, and tasks that move from backlog to done.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* For errors from controls with no room for inline messages (e.g.
            icon buttons in table rows). "system" matches globals.css, which
            switches to dark mode via prefers-color-scheme. */}
        <Toaster theme="system" richColors closeButton />
      </body>
    </html>
  );
}
