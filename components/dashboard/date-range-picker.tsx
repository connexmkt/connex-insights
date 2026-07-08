"use client";

import { cn } from "@/lib/utils";
import type { AnalyticsPeriodPreset } from "@/types/analytics";

const PERIOD_OPTIONS: Array<{ key: AnalyticsPeriodPreset; label: string }> = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "6m", label: "6 meses" },
  { key: "12m", label: "12 meses" },
];

interface DateRangePickerProps {
  value: AnalyticsPeriodPreset;
  onChange: (period: AnalyticsPeriodPreset) => void;
  compare: boolean;
  onCompareChange: (compare: boolean) => void;
}

export function DateRangePicker({
  value,
  onChange,
  compare,
  onCompareChange,
}: DateRangePickerProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1"
        role="group"
        aria-label="Período de análise"
      >
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              value === option.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={compare}
          onChange={(event) => onCompareChange(event.target.checked)}
          className="size-4 rounded border-border"
        />
        Comparar com período anterior
      </label>
    </div>
  );
}
