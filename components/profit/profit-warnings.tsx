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
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div
          className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          key={warning}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{warning}</p>
        </div>
      ))}
    </div>
  );
}
