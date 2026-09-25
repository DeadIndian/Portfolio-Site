import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "./globals.css";
import "./worlds.css";

const siteUrl = "https://gollabharath.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Golla Bharath / Dead Indian - Software, Systems & Open Source",
  description:
    "Software engineer, infrastructure builder, KDE Plasma contributor, and Recurse Club Head. Two sides of Golla Bharath: professional work and open-source curiosity.",
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Bharath / Dead Indian",
    title: "Golla Bharath. Same human. Different shell.",
    description:
      "Full-stack software, infrastructure, Linux, and the open-source work in between.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Golla Bharath / Dead Indian portfolio",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#edf0f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
