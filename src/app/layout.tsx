import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { IOSBottomTabBar } from "@/components/customer/IOSBottomTabBar";
import { EnquiryToast } from "@/components/customer/EnquiryToast";
import { FloatingWhatsAppDesk } from "@/components/customer/FloatingWhatsAppDesk";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171a1f",
};

export const metadata: Metadata = {
  title: "Suzuki Mauritius | Parts & Owner Network",
  description:
    "Private customer network for Suzuki owners in Mauritius. Browse genuine parts, manage vehicles, and send dealer inquiries without online checkout.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Suzuki Mauritius",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-amazon-bg text-amazon-text min-h-screen pb-16 md:pb-0">
        {children}
        <EnquiryToast />
        <FloatingWhatsAppDesk />
        <IOSBottomTabBar />
      </body>
    </html>
  );
}
