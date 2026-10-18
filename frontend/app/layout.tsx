import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type React from "react";
import "./globals.css";
import "./product-detail.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BrewLite",
  description: "Cà phê ngon - Đặt nhanh - Thanh toán không tiền mặt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`h-full antialiased ${plusJakartaSans.variable}`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
