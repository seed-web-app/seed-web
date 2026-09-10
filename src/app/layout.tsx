import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suzuki Parts Customer Network | Authorized Dealer",
  description:
    "Direct owner access to authorized Suzuki auto-parts, OEM body panels, mechanical components, and care guides. Connect with dealer parts specialists.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-suzuki-black text-suzuki-light min-h-screen selection:bg-suzuki-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
