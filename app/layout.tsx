import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SESSION_COOKIE, getUserFromToken } from "@/lib/auth/session";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The signed session cookie is verified on the server, so the client never decides its own role.
  const user = await getUserFromToken((await cookies()).get(SESSION_COOKIE)?.value);

  return (
    <html
      lang="fr"
      className={`${fontSans.variable} ${fontHeading.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-dvh flex-col overflow-hidden bg-background text-foreground font-sans lg:flex-row">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider user={user}>
            <AppShell>{children}</AppShell>
          </AuthProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
