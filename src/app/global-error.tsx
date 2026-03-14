"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-slate-800">
        <h1 className="text-xl font-semibold">Něco se pokazilo</h1>
        <p className="mt-2 text-slate-600 text-sm text-center max-w-md">
          {error.message || "Došlo k závažné chybě."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Zkusit znovu
        </button>
      </body>
    </html>
  );
}
