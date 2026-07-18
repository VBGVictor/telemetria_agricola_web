import type { CleanEvent } from "../data-cleaning/clean-events";
import type { RawEvent, RawMachine } from "../types/raw-data";

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
  machines: RawMachine[],
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
