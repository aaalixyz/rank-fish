import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { DemoModeProvider } from "@/components/demo-mode";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "rank.fish — pay to appear",
  description:
    "Pay to appear on the field. Boost any link, leave a message, climb the rank.",
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${syne.variable} min-h-screen bg-[#f7f6f3] font-sans text-neutral-900 antialiased`}
      >
        <TooltipProvider>
          <DemoModeProvider>{children}</DemoModeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
