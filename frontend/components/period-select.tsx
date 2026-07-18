"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PERIOD_OPTIONS = [
  { value: "2026-06-01|2026-06-08", label: "01/06/2026 – 07/06/2026" },
  { value: "2026-06-01|2026-06-04", label: "01/06/2026 – 03/06/2026" },
  { value: "2026-06-04|2026-06-08", label: "04/06/2026 – 07/06/2026" },
];

export const DEFAULT_PERIOD_VALUE = PERIOD_OPTIONS[0].value;

export function parsePeriod(value: string): { from: string; to: string } {
  const [from, to] = value.split("|");
  return { from: `${from}T00:00:00.000Z`, to: `${to}T00:00:00.000Z` };
}

export function PeriodSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("periodo") ?? DEFAULT_PERIOD_VALUE;

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams);
    params.set("periodo", value);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
