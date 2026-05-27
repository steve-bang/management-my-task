import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusFlow — Quản lý công việc",
  description: "Ứng dụng quản lý công việc đơn giản và hiệu quả",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
