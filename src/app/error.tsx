"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-xl font-semibold text-slate-800">Něco se pokazilo</h1>
      <p className="mt-2 text-slate-600 text-sm text-center max-w-md">
        {error.message || "Došlo k chybě při načítání stránky."}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Zkusit znovu
        </button>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Na úvod
        </Link>
      </div>
    </main>
  );
}
