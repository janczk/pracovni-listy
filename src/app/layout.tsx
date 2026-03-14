import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ANALYTICS_ALLOWED_BETA_CODE } from "@/lib/constants";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Generátor pracovních listů",
  description: "Vytvářejte pracovní listy a otázky k porozumění textu pro výuku.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const beta = cookieStore.get("beta_access")?.value?.trim().toLowerCase();
  const canViewAnalytics = beta === ANALYTICS_ALLOWED_BETA_CODE;

  return (
    <html lang="cs" className={plusJakarta.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
        <header className="no-print border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-10 w-10 shrink-0 object-contain"
              />
              <span className="font-semibold text-slate-800">
                Generátor pracovních listů
              </span>
            </div>
            <div className="flex items-center gap-4">
              {canViewAnalytics && (
                <Link
                  href="/analytics"
                  className="no-print text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
                >
                  Statistiky
                </Link>
              )}
              {beta && (
                <a
                  href="/api/beta-logout"
                  className="no-print text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
                >
                  Odhlásit
                </a>
              )}
            </div>
          </div>
        </header>
        <div className="min-h-[calc(100vh-3.5rem)]">
          {children}
        </div>
      </body>
    </html>
  );
}
