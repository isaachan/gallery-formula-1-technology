import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F1 Track Chronicle",
  description: "Mobile-first Formula 1 history learning experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
