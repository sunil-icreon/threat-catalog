import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Threat Catalog | Vulnerability Monitor",
  description:
    "Dashboard for monitoring vulnerabilities across multiple ecosystems"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <link
          rel='stylesheet'
          href='https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css'
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
