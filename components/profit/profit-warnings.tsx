"use client";

import { AlertTriangle } from "lucide-react";

type ProfitWarningsProps = {
  warnings: string[];
};

export function ProfitWarnings({ warnings }: ProfitWarningsProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-warning-border bg-warning-surface text-warning-foreground">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-accent/10 text-warning-accent">
            <AlertTriangle className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Dikkat gereken noktalar
            </h3>
            <p className="mt-0.5 text-xs text-warning-foreground">
              Hesabı kaydetmeden önce bu varsayımları kontrol edin.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-warning-border bg-background/40 px-2.5 py-1 text-xs font-semibold text-warning-accent">
          {warnings.length}
        </span>
      </div>
      <ul className="border-t border-warning-border">
        {warnings.map((warning) => (
          <li
            className="flex gap-3 border-b border-warning-border/70 px-4 py-3 text-sm leading-6 last:border-b-0 sm:px-5"
            key={warning}
          >
            <span
              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-warning-accent"
              aria-hidden="true"
            />
            <p>{warning}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
