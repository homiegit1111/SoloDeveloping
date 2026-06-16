import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";

export const metadata: Metadata = {
  title: "SoloDeveloping — Arise, Hunter",
  description:
    "Ravi's System. A Solo Leveling transformation engine — track quests, ascend ranks E to SS, and let the legends forge your comeback.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#030305",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Syne — commanding manhwa display. Space Mono — terminal/System body. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-system min-h-screen">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
