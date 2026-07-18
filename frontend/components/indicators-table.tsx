import { formatHours, formatPercent, MACHINE_TYPE_LABEL } from "@/lib/format";
import type { Machine, MachineSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function availabilityTone(ratio: number): "good" | "warn" | "crit" {
  if (ratio >= 0.8) return "good";
  if (ratio >= 0.7) return "warn";
  return "crit";
}

const TONE_CLASSES: Record<string, string> = {
  good: "bg-green-100 text-green-800",
  warn: "bg-amber-100 text-amber-800",
  crit: "bg-red-100 text-red-800",
};

export function IndicatorsTable({ machines, summary }: { machines: Machine[]; summary: MachineSummary[] }) {
  const machineByCode = new Map(machines.map((machine) => [machine.code, machine]));
  const rows = [...summary].sort((a, b) => a.machineCode.localeCompare(b.machineCode));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Máquina</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Efetivo (h)</TableHead>
            <TableHead className="text-right">Manobra (h)</TableHead>
            <TableHead className="text-right">Desloc. (h)</TableHead>
            <TableHead className="text-right">Aguard. (h)</TableHead>
            <TableHead className="text-right">Manut. (h)</TableHead>
            <TableHead className="text-right">Total (h)</TableHead>
            <TableHead className="text-right">Disponibilidade</TableHead>
            <TableHead className="text-right">Eficiência</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const machine = machineByCode.get(row.machineCode);
            const tone = availabilityTone(row.availability);

            return (
              <TableRow key={row.machineCode}>
                <TableCell>
                  <span className="font-semibold">{row.machineCode}</span>{" "}
                  <span className="text-muted-foreground">· {machine?.name ?? "máquina excluída"}</span>
                </TableCell>
                <TableCell>
                  {machine ? <Badge variant="secondary">{MACHINE_TYPE_LABEL[machine.type]}</Badge> : "—"}
                </TableCell>
                <TableCell className="text-right">{formatHours(row.hoursByGroup.Efetivo)}</TableCell>
                <TableCell className="text-right">{formatHours(row.hoursByGroup.Manobra)}</TableCell>
                <TableCell className="text-right">{formatHours(row.hoursByGroup.Deslocamento)}</TableCell>
                <TableCell className="text-right">{formatHours(row.hoursByGroup.Aguardando)}</TableCell>
                <TableCell className="text-right">{formatHours(row.hoursByGroup["Manutenção"])}</TableCell>
                <TableCell className="text-right font-semibold">{formatHours(row.totalHours)}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", TONE_CLASSES[tone])}
                  >
                    {formatPercent(row.availability)}
                  </span>
                </TableCell>
                <TableCell className="text-right">{formatPercent(row.efficiency)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
