import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter is the go-to font for premium fintech products —
// clean, readable at small sizes, and professional at large ones.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RevivePay AI — Revenue Recovery Agent",
  description:
    "AI-powered autonomous revenue recovery for merchants. " +
    "Detect at-risk revenue, apply intelligent recovery strategies, " +
    "and track every rupee back to the source.",
  keywords: [
    "revenue recovery",
    "AI payments",
    "failed payment recovery",
    "merchant tools",
    "fintech AI",
  ],
};

type Props = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased">
        {children}
      </body>
    </html>
  );
}
