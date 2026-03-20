import type { Metadata } from "next";
import { Josefin_Sans, Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const josefinSans = Josefin_Sans({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-josefin",
  display: "swap",
});

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Full Funnel — Growth Strategy Portal",
  description: "Private client portal for Full Funnel business consulting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${josefinSans.variable} ${inter.variable} font-sans bg-white text-navy antialiased`}>
        <Providers>{children}</Providers>
      </body>
      {ga4Id && <GoogleAnalytics gaId={ga4Id} />}
    </html>
  );
}
