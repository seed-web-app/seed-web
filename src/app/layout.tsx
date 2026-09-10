import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { IOSBottomTabBar } from "@/components/customer/IOSBottomTabBar";
import { EnquiryToast } from "@/components/customer/EnquiryToast";
import { FloatingWhatsAppDesk } from "@/components/customer/FloatingWhatsAppDesk";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#131921",
};

export const metadata: Metadata = {
  title: "Suzuki Mauritius | Customer Network & Auto-Parts Marketplace",
  description:
    "Official customer network for Suzuki owners in Mauritius. Genuine parts catalog, vehicle showcase, technical car care news, and owner community forum.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Suzuki Mauritius",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-amazon-bg text-amazon-text min-h-screen selection:bg-amazon-yellow selection:text-black pb-16 md:pb-0">
        {children}
        <EnquiryToast />
        <FloatingWhatsAppDesk />
        <IOSBottomTabBar />
      </body>
    </html>
  );
}
