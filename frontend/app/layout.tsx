import type { Metadata } from "next";
import "./globals.css";
import "./product-detail.css";

export const metadata: Metadata = {
  title: "BrewLite",
  description: "Cà phê ngon - Đặt nhanh - Thanh toán không tiền mặt",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
