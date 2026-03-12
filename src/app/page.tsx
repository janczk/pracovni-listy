import Link from "next/link";
import { TEXTS } from "@/lib/czech";

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1">
      <div className="max-w-2xl mx-auto w-full px-4 py-12 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
          Pro učitele
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
          {TEXTS.appTitle}
        </h1>
        <p className="mt-3 text-slate-600 text-lg">
          {TEXTS.appSubtitle}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link
            href="/create-from-topic"
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            <span className="text-lg font-semibold text-slate-900 group-hover:text-teal-700">
              {TEXTS.createFromTopic}
            </span>
            <span className="mt-2 text-sm text-slate-500 leading-relaxed">
              Zadejte předmět, ročník a téma. Získáte hotový pracovní list nebo otázky k porozumění textu.
            </span>
          </Link>

          <Link
            href="/create-from-textbook"
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            <span className="text-lg font-semibold text-slate-900 group-hover:text-teal-700">
              {TEXTS.createFromTextbook}
            </span>
            <span className="mt-2 text-sm text-slate-500 leading-relaxed">
              Nahrajte fotky stránek nebo PDF. Z obsahu vytvoříme úlohy.
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
