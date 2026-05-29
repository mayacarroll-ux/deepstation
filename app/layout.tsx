import type { Metadata } from "next";
import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";

import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { applicationName } from "@/lib/constants";

fontAwesomeConfig.autoAddCss = false;

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
