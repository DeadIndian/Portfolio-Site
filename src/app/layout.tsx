import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "./globals.css";
import "./worlds.css";
import "./journey.css";

const siteUrl = "https://gollabharath.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Golla Bharath / Dead Indian - Software, Systems & Open Source",
  description:
    "Explore Golla Bharath's Linux desktop and DeadIndian's universe: engineering projects, open-source work, and the worlds that shaped the person behind them.",
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Bharath / Dead Indian",
    title: "Golla Bharath. Same human. Different shell.",
    description:
      "An engineer's desktop. A universe in the making. Software, Linux, and the stories behind the work.",
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
  themeColor: "#1b1f26",
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
