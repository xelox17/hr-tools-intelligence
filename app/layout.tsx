import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { Toaster } from "@/components/ui/sonner";
import { LESAFFRE_THEME } from "@/lib/config/branding";
import "./globals.css";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontHeading = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: `${LESAFFRE_THEME.portalName} — ${LESAFFRE_THEME.productName}`,
  description:
    "BI & AI layer over Lesaffre's global HR toolset — case study by Anas Mehri, ESAIP Angers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fontSans.variable} ${fontHeading.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-screen flex-col overflow-hidden bg-background text-foreground font-sans md:flex-row">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Sidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Header />
            <main className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</div>
            </main>
          </div>
          <FloatingChatWidget />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
