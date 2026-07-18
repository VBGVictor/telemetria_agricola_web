import { formatHours, formatPercent, MACHINE_TYPE_LABEL, MACHINE_TYPE_LABEL_PLURAL } from "@/lib/format";
import type { Machine, MachineSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function KpiCards({ machines, summary }: { machines: Machine[]; summary: MachineSummary[] }) {
  const totalsByType = machines.reduce<Record<string, number>>((acc, machine) => {
    acc[machine.type] = (acc[machine.type] ?? 0) + 1;
    return acc;
  }, {});

  const typeBreakdown = Object.entries(totalsByType)
    .map(([type, count]) => {
      const label = count > 1 ? MACHINE_TYPE_LABEL_PLURAL[type] : MACHINE_TYPE_LABEL[type]?.toLowerCase();
      return `${count} ${label}`;
    })
    .join(" · ");

  const totalHours = summary.reduce((sum, item) => sum + item.totalHours, 0);
  const avgAvailability = average(summary.map((item) => item.availability));
  const avgEfficiency = average(summary.map((item) => item.efficiency));

  const cards = [
    { label: "Máquinas ativas", value: String(machines.length), hint: typeBreakdown || "—" },
    { label: "Horas totais", value: `${formatHours(totalHours)} h`, hint: "no período" },
    {
      label: "Disponibilidade média",
      value: formatPercent(avgAvailability),
      hint: "(total − manutenção) ÷ total",
    },
    { label: "Eficiência média", value: formatPercent(avgEfficiency), hint: "efetivo ÷ total" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
            <div className="mt-1 text-2xl font-bold tracking-tight">{card.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{card.hint}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
