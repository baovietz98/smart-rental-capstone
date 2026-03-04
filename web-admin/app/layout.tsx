import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản Lý Trọ Thông Minh - Smart Rental",
  description:
    "Giải pháp quản lý nhà trọ, phòng trọ, chung cư mini chuyên nghiệp, tối ưu chi phí và minh bạch cho cả chủ nhà lẫn khách thuê.",
  openGraph: {
    title: "Smart Rental - Cổng Thông Tin Quản Lý Nhà Trọ",
    description: "Giải pháp quản lý nhà trọ, chung cư mini chuyên nghiệp.",
    url: "https://smartrental.vn",
    siteName: "Smart Rental",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F4F4F0] text-black`}
        suppressHydrationWarning={true}
      >
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#000000", // Neobrutalism typically uses black or high contrast
              },
            }}
          >
            <App>{children}</App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
