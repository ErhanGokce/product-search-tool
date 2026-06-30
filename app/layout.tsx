import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeScript = `
(function () {
  try {
    var storedTheme = window.localStorage.getItem("theme");
    var cookieTheme = document.cookie.match(/(?:^|; )theme=(light|dark|system)/);
    var theme = storedTheme || (cookieTheme && cookieTheme[1]) || "dark";
    if (theme !== "light" && theme !== "dark" && theme !== "system") theme = "dark";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
})();
`;

export const metadata: Metadata = {
  title: "Product Search",
  description: "Ürün araştırması, fırsat analizi ve kâr hesaplama paneli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          id="theme-script"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
