import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import SiteNav from "./components/SiteNav";
import { WuMark } from "./components/WuMark";
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

const themeInitScript = `(function(){try{var d=localStorage.getItem("theme")==="dark";document.documentElement.classList.toggle("dark",d);var l=document.getElementById("favicon");if(l)l.href=d?"/favicon/dark":"/favicon/light";}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${absans.variable} ${cangerfeibai.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link id="favicon" rel="icon" href="/favicon/light" type="image/png" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Link
          href="/"
          aria-label="Home"
          className="fixed left-4 top-4 z-50 sm:left-6 sm:top-5"
        >
          <WuMark size={44} />
        </Link>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
