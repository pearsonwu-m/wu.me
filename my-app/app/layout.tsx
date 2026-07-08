import type { Metadata } from "next";
import localFont from "next/font/local";
import SiteNav from "./components/SiteNav";
import "./globals.css";

const absans = localFont({
  src: "./fonts/Absans-Regular.woff2",
  variable: "--font-absans",
  weight: "400",
  display: "swap",
});

const cangerfeibai = localFont({
  src: "./fonts/CangErFeiBaiW01-2.ttf",
  variable: "--font-cangerfeibai",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pearson Wu",
  description: "Physics, technology, and society.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${absans.variable} ${cangerfeibai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
