import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doutor Agenda",
  description: "Sistema de gestão de consultas médicas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-full w-full flex-col antialiased`}
      >
        <div className="flex h-full w-full flex-grow flex-col">{children}</div>
        <Toaster position="bottom-center" richColors theme="light" />
      </body>
    </html>
  );
}
