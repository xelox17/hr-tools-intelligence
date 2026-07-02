import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontHeading = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "HR Tools Intelligence",
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
    >
      <body className="h-screen overflow-hidden flex bg-background text-foreground font-sans">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
