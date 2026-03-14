"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BETA_USER_LABELS } from "@/lib/constants";

type DailyStats = { generated: number; basicAndLmp: number; basicAndSvp: number };
type StatsByDate = Record<string, DailyStats>;
type StatsPayload = { overall: StatsByDate; byUser: Record<string, StatsByDate> };

function formatDate(key: string): string {
  const [y, m, d] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function totalsFromStatsByDate(stats: StatsByDate): DailyStats {
  return Object.values(stats).reduce(
    (acc, d) => {
      acc.generated += d.generated ?? 0;
      acc.basicAndLmp += d.basicAndLmp ?? 0;
      acc.basicAndSvp += d.basicAndSvp ?? 0;
      return acc;
    },
    { generated: 0, basicAndLmp: 0, basicAndSvp: 0 }
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/stats")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: StatsPayload) => setStats(data))
      .catch(() => setError("Statistiky se nepodařilo načíst."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-slate-500">Načítání…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-red-600">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-teal-600 hover:underline">
            Zpět na úvod
          </Link>
        </div>
      </main>
    );
  }

  const overall = stats?.overall ?? {};
  const byUser = stats?.byUser ?? {};
  const dates = Object.keys(overall).sort((a, b) => b.localeCompare(a));
  const totalsOverall = totalsFromStatsByDate(overall);

  // Řazení uživatelů podle BETA_USER_LABELS, pak ostatní (podle klíče v byUser)
  const orderedUserIds = [
    ...Object.keys(BETA_USER_LABELS),
    ...Object.keys(byUser).filter((id) => !(id in BETA_USER_LABELS)),
  ].filter((id, i, arr) => arr.indexOf(id) === i);

  // Součet řádků v tabulce „Podle beta uživatelů“ (musí sedět s čísly v tabulce)
  const totalsByUser = orderedUserIds.reduce(
    (acc, userId) => {
      const t = totalsFromStatsByDate(byUser[userId] ?? {});
      acc.generated += t.generated;
      acc.basicAndLmp += t.basicAndLmp;
      acc.basicAndSvp += t.basicAndSvp;
      return acc;
    },
    { generated: 0, basicAndLmp: 0, basicAndSvp: 0 }
  );

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-primary-600 no-print transition-colors"
        >
          ← Zpět na úvod
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Statistiky generování
        </h1>
        <p className="mt-1 text-slate-600 text-sm">
          Celkové statistiky a přehled podle beta uživatelů.
        </p>

        {/* Tabulka Celkem podle dnů */}
        <h2 className="mt-10 text-lg font-semibold text-slate-800">Celkem podle dnů</h2>
        {dates.length === 0 ? (
          <p className="mt-2 text-slate-500">Zatím nejsou žádné záznamy.</p>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-700">Datum</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">
                    Vygenerované listy
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">
                    Běžná ZŠ + LMP
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">
                    Běžná ZŠ + SVP
                  </th>
                </tr>
              </thead>
              <tbody>
                {dates.map((key) => {
                  const d = overall[key];
                  return (
                    <tr key={key} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-800">{formatDate(key)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{d?.generated ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{d?.basicAndLmp ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{d?.basicAndSvp ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-medium">
                  <td className="px-4 py-3 text-slate-800">Celkem</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalsOverall.generated}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalsOverall.basicAndLmp}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalsOverall.basicAndSvp}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tabulka podle uživatelů (součty za každého) */}
        <h2 className="mt-10 text-lg font-semibold text-slate-800">Podle beta uživatelů</h2>
        {orderedUserIds.length === 0 ? (
          <p className="mt-2 text-slate-500">Zatím nejsou záznamy podle uživatelů.</p>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-700">Uživatel</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">
                    Vygenerované listy
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">
                    Běžná ZŠ + LMP
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">
                    Běžná ZŠ + SVP
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderedUserIds.map((userId) => {
                  const userStats = byUser[userId] ?? {};
                  const t = totalsFromStatsByDate(userStats);
                  const label = BETA_USER_LABELS[userId] ?? userId;
                  return (
                    <tr key={userId} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-800">
                        <span className="font-medium">{label}</span>
                        {!(userId in BETA_USER_LABELS) && (
                          <span className="ml-1 text-slate-500 text-xs">{userId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.generated}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.basicAndLmp}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.basicAndSvp}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-medium">
                  <td className="px-4 py-3 text-slate-800">Součet uživatelů</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalsByUser.generated}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalsByUser.basicAndLmp}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalsByUser.basicAndSvp}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {orderedUserIds.length > 0 &&
          (totalsByUser.generated !== totalsOverall.generated ||
            totalsByUser.basicAndLmp !== totalsOverall.basicAndLmp ||
            totalsByUser.basicAndSvp !== totalsOverall.basicAndSvp) && (
            <p className="mt-2 text-xs text-slate-500">
              Rozdíl oproti „Celkem podle dnů“ jsou záznamy z doby před sledováním podle uživatelů nebo bez přihlášení beta kódem.
            </p>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Vygenerované listy = každé volání generování (z tématu nebo z učebnice). Běžná ZŠ + LMP = listy pro žáky s LMP. Běžná ZŠ + SVP = listy s přidanou zjednodušenou verzí pro SVP.
        </p>
        <p className="mt-2 text-xs">
          <a
            href="/api/analytics/status"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            Diagnostika úložiště (Redis / env)
          </a>
        </p>
      </div>
    </main>
  );
}
