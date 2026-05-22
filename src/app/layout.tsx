import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { OfflineBanner } from "@/components/offline-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { baseMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = baseMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080C0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`} data-theme="dark">
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider delayDuration={150}>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[100] rounded-[--radius-md] bg-[var(--md-sys-color-surface)] px-4 py-2 text-sm font-medium text-[var(--md-sys-color-on-surface)] shadow-elevated focus:outline-2 focus:outline-[var(--md-sys-color-primary)]"
            >
              Skip to content
            </a>
            <OfflineBanner />
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main id="main-content" className="flex-1 animate-fade-in-up">{children}</main>
              <SiteFooter />
            </div>
            <OnboardingTour />
          </TooltipProvider>
          <Toaster position="bottom-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}


