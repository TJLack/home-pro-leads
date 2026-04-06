import type { Metadata } from "next";
import "./globals.css";

import { appConfig } from "@/lib/config/app.config";

export const metadata: Metadata = {
  title: `${appConfig.productName} | ${appConfig.companyName}`,
  description:
    "Find hidden conversion leaks on home service websites with production-grade website analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
