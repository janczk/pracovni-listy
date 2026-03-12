import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Generátor pracovních listů",
  description: "Vytvářejte pracovní listy a otázky k porozumění textu pro výuku.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className={plusJakarta.variable}>
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-primary-50/30 text-slate-800 antialiased font-sans">
        <header className="no-print border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <span className="font-semibold text-slate-800">
              Generátor pracovních listů
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
