"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

export default function BetaGatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem("website") as HTMLInputElement)?.value ?? "";

    try {
      const res = await fetch("/api/beta-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), website: honeypot }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setError("Neplatný beta kód. Zkontrolujte ho a zadejte znovu.");
        } else if (res.status === 400) {
          setError("Přístup odepřen.");
        } else {
          setError(data?.error ?? "Něco se pokazilo. Zkuste to znovu.");
        }
        setLoading(false);
        return;
      }

      window.location.assign("/");
    } catch {
      setError("Spojení se nezdařilo. Zkuste to znovu.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-center">
        <img
          src="/logo.png"
          alt="Logo"
          className="mx-auto h-20 w-20 object-contain"
        />
        <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary-600">
          Generátor pracovních listů
        </p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">
          Beta přístup
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Pro vstup zadejte beta kód, který jste obdrželi.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Honeypot – skryté pole pro boty; uživatel ho nevyplňuje */}
          <div className="absolute -left-[9999px] top-0" aria-hidden="true">
            <label htmlFor="website">Web</label>
            <input
              id="website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-slate-700">
              Beta kód
            </label>
            <input
              id="code"
              type="text"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoComplete="off"
              className="mt-1.5 w-full"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ověřuji…" : "Vstoupit"}
          </Button>
        </form>

        <p className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500">
          Generátor pracovních listů © {new Date().getFullYear()}
          <br />
          Autor: Jan Kučeřík
        </p>
      </div>
    </main>
  );
}
