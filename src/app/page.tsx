import Link from "next/link";
import { TEXTS } from "@/lib/czech";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {TEXTS.appTitle}
        </h1>
        <p className="mt-2 text-slate-600">
          {TEXTS.appSubtitle}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/create-from-topic"
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <span className="text-lg font-semibold text-slate-900 group-hover:text-slate-700">
              {TEXTS.createFromTopic}
            </span>
            <span className="mt-1 text-sm text-slate-500">
              Zadejte předmět, ročník a téma. Získáte hotový pracovní list nebo otázky k porozumění textu.
            </span>
          </Link>

          <Link
            href="/create-from-textbook"
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <span className="text-lg font-semibold text-slate-900 group-hover:text-slate-700">
              {TEXTS.createFromTextbook}
            </span>
            <span className="mt-1 text-sm text-slate-500">
              Nahrajte fotky stránek nebo PDF. Z obsahu vytvoříme úlohy.
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
