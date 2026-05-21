import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "./globals.css";

import { applicationName } from "@/lib/constants";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: applicationName,
  description: "Time tracking for projects, tasks, and work summaries"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={poppins.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
