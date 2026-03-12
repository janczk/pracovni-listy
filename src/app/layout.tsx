import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="cs">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
