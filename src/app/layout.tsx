import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suzuki Mauritius | Customer Network & Auto-Parts Marketplace",
  description:
    "Official customer network for Suzuki owners in Mauritius. Genuine parts catalog, vehicle showcase, technical car care news, and owner community forum.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-amazon-bg text-amazon-text min-h-screen selection:bg-amazon-yellow selection:text-black">
        {children}
      </body>
    </html>
  );
}
