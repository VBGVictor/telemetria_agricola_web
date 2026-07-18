import type { CleanEvent } from "../data-cleaning/clean-events";
import type { RawEvent } from "../types/raw-data";

// só o código é usado aqui — aceitar qualquer objeto com "code" evita acoplar
// essa função ao formato completo de RawMachine (ela não precisa do resto)
export type MachineForSummary = { code: string };

type EventGroupValue = RawEvent["eventGroup"];

const EVENT_GROUPS: EventGroupValue[] = [
  "Efetivo",
  "Manobra",
  "Deslocamento",
  "Aguardando",
  "Manutenção",
];

export type MachineSummary = {
  machineCode: string;
  hoursByGroup: Record<EventGroupValue, number>;
  totalHours: number;
  availability: number;
  efficiency: number;
};

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildEmptyGroupTotals(): Record<EventGroupValue, number> {
  const totals = {} as Record<EventGroupValue, number>;
  for (const group of EVENT_GROUPS) totals[group] = 0;
  return totals;
}

function clipEventToPeriod(
  event: CleanEvent,
  from: Date,
  to: Date
): { start: Date; end: Date } | null {
  const eventStart = new Date(event.startTime);
  const eventEnd = event.endTime ? new Date(event.endTime) : to;

  const start = eventStart > from ? eventStart : from;
  const end = eventEnd < to ? eventEnd : to;

  if (start >= end) return null;

  return { start, end };
}

function sumMinutesByMachineAndGroup(
  events: CleanEvent[],
  from: Date,
  to: Date
): Map<string, Record<EventGroupValue, number>> {
  const totalsByMachine = new Map<string, Record<EventGroupValue, number>>();

  for (const event of events) {
    const clipped = clipEventToPeriod(event, from, to);
    if (!clipped) continue;

    const minutes = (clipped.end.getTime() - clipped.start.getTime()) / 60000;
    const totals = totalsByMachine.get(event.machineCode) ?? buildEmptyGroupTotals();
    totals[event.eventGroup] += minutes;
    totalsByMachine.set(event.machineCode, totals);
  }

  return totalsByMachine;
}

export function computeMachineSummary(
  events: CleanEvent[],
  machines: MachineForSummary[],
  period: { from: string; to: string }
): MachineSummary[] {
  const from = new Date(period.from);
  const to = new Date(period.to);

  const minutesByMachine = sumMinutesByMachineAndGroup(events, from, to);

  return machines.map((machine) => {
    const minutes = minutesByMachine.get(machine.code) ?? buildEmptyGroupTotals();

    const hoursByGroup = {} as Record<EventGroupValue, number>;
    for (const group of EVENT_GROUPS) {
      hoursByGroup[group] = roundTo(minutes[group] / 60, 2);
    }

    const totalHours = roundTo(
      EVENT_GROUPS.reduce((sum, group) => sum + hoursByGroup[group], 0),
      2
    );

    const availability =
      totalHours > 0 ? roundTo((totalHours - hoursByGroup["Manutenção"]) / totalHours, 4) : 0;
    const efficiency = totalHours > 0 ? roundTo(hoursByGroup["Efetivo"] / totalHours, 4) : 0;

    return {
      machineCode: machine.code,
      hoursByGroup,
      totalHours,
      availability,
      efficiency,
    };
  });
}

export type DaySummary = {
  date: string;
  hoursByGroup: Record<EventGroupValue, number>;
  totalHours: number;
};

// horas por grupo, por dia, somando a frota inteira (não separado por máquina) —
// é o que alimenta o gráfico "horas por grupo de evento ao longo dos dias"
export function computeDailySummary(
  events: CleanEvent[],
  period: { from: string; to: string }
): DaySummary[] {
  const from = new Date(period.from);
  const to = new Date(period.to);
  const days: DaySummary[] = [];

  let dayStart = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));

  while (dayStart < to) {
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const effectiveStart = dayStart > from ? dayStart : from;
    const effectiveEnd = dayEnd < to ? dayEnd : to;

    const minutesByGroup = buildEmptyGroupTotals();
    for (const event of events) {
      const clipped = clipEventToPeriod(event, effectiveStart, effectiveEnd);
      if (!clipped) continue;
      const minutes = (clipped.end.getTime() - clipped.start.getTime()) / 60000;
      minutesByGroup[event.eventGroup] += minutes;
    }

    const hoursByGroup = {} as Record<EventGroupValue, number>;
    for (const group of EVENT_GROUPS) {
      hoursByGroup[group] = roundTo(minutesByGroup[group] / 60, 2);
    }
    const totalHours = roundTo(
      EVENT_GROUPS.reduce((sum, group) => sum + hoursByGroup[group], 0),
      2
    );

    days.push({ date: dayStart.toISOString().slice(0, 10), hoursByGroup, totalHours });
    dayStart = dayEnd;
  }

  return days;
}
