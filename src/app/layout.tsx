import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import React from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "optional", // Changed from swap to optional to prevent layout shift
  preload: true,
  variable: "--font-inter",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "sans-serif"],
  adjustFontFallback: true
});

export const metadata: Metadata = {
  title: "Threat Catalog | Vulnerability Monitor",
  description:
    "Dashboard for monitoring vulnerabilities across multiple ecosystems",
  keywords: ["vulnerability", "security", "npm", "maven", "nuget", "threat", "advisory"],
  authors: [{ name: "Threat Catalog" }],
  creator: "Threat Catalog",
  publisher: "Threat Catalog",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3031"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Threat Catalog | Vulnerability Monitor",
    description: "Dashboard for monitoring vulnerabilities across multiple ecosystems",
    url: "/",
    siteName: "Threat Catalog",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Threat Catalog | Vulnerability Monitor",
    description: "Dashboard for monitoring vulnerabilities across multiple ecosystems"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/logo.png", type: "image/png", sizes: "32x32" },
      { url: "/logo.png", type: "image/png", sizes: "16x16" }
    ],
    apple: [
      { url: "/logo.png", type: "image/png" }
    ],
    shortcut: "/logo.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={inter.variable}>
      <head>
        <link
          rel='preconnect'
          href='https://cdn.jsdelivr.net'
          crossOrigin='anonymous'
        />
        <link
          rel='dns-prefetch'
          href='https://cdn.jsdelivr.net'
        />
        <link
          rel='stylesheet'
          href='https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css'
        />
        <link rel='icon' href='/logo.png' type='image/png' />
        <link rel='shortcut icon' href='/logo.png' type='image/png' />
        <link rel='apple-touch-icon' href='/logo.png' />
        <link rel='manifest' href='/manifest.json' />
        <meta name='theme-color' content='#212529' />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Threat Catalog",
              description: "Dashboard for monitoring vulnerabilities across multiple ecosystems",
              url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3031",
              applicationCategory: "SecurityApplication",
              operatingSystem: "Web"
            })
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
