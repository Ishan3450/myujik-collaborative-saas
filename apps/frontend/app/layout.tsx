import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppBar } from "@/components/AppBar";
import { Toaster } from "react-hot-toast";

import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();
const defaultTitle = "Myujik - Collaborative live music streams";
const defaultDescription = "Create a stream room, share YouTube song suggestions, upvote the queue, and listen together in real time.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/icon.png",
  },
  title: {
    default: "Myujik",
    template: "%s · Myujik",
  },
  description: defaultDescription,
  applicationName: "Myujik",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Myujik",
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <Providers>
          <AppBar />
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
