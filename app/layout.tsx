import type { Metadata } from "next";

import "./globals.css";

import { applicationName } from "@/lib/constants";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
