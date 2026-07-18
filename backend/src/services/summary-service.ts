import { computeMachineSummary, type MachineForSummary, type MachineSummary } from "../indicators/compute-summary";
import type { CleanEvent } from "../data-cleaning/clean-events";
import { RAW_GROUP_BY_EVENT_GROUP } from "../lib/enum-mappings";
import { getCachedSummary, setCachedSummary } from "../lib/summary-cache";
import { findEventsOverlappingPeriod, type EventWithMachineCode } from "../repositories/event-repository";
import { findActiveMachines, findMachinesByIds } from "../repositories/machine-repository";
import type { SummaryQuery } from "../schemas/query-schema";

const DEFAULT_PERIOD = {
  from: "2026-06-01T00:00:00.000Z",
  to: "2026-06-08T00:00:00.000Z",
};

function toCleanEvent(event: EventWithMachineCode): CleanEvent {
  return {
    id: event.id,
    machineCode: event.machine.code,
    eventGroup: RAW_GROUP_BY_EVENT_GROUP[event.eventGroup],
    startTime: event.startTime.toISOString(),
    endTime: event.endTime ? event.endTime.toISOString() : null,
  };
}

export async function getFleetSummary(query: SummaryQuery): Promise<MachineSummary[]> {
  const period = {
    from: query.from ?? DEFAULT_PERIOD.from,
    to: query.to ?? DEFAULT_PERIOD.to,
  };

  const cacheKey = `${period.from}|${period.to}`;
  const cached = getCachedSummary(cacheKey);
  if (cached) return cached;

  const from = new Date(period.from);
  const to = new Date(period.to);

  const [eventsInPeriod, activeMachines] = await Promise.all([
    findEventsOverlappingPeriod(from, to),
    findActiveMachines({}),
  ]);

  // maquinas ativas sempre entram (mesmo sem evento no periodo, aparecem zeradas).
  // maquina ja excluida so entra se teve evento de verdade nesse periodo especifico —
  // é o modelo hibrido: indicador de periodo e historico, card de "ativas" nao é aqui.
  const activeMachineIds = new Set(activeMachines.map((machine) => machine.id));
  const machineIdsWithEvents = new Set(eventsInPeriod.map((event) => event.machineId));
  const deletedMachineIdsWithEvents = [...machineIdsWithEvents].filter(
    (id) => !activeMachineIds.has(id)
  );
  const deletedMachinesWithEvents = await findMachinesByIds(deletedMachineIdsWithEvents);

  const machines: MachineForSummary[] = [...activeMachines, ...deletedMachinesWithEvents];
  const cleanEvents = eventsInPeriod.map(toCleanEvent);

  const summary = computeMachineSummary(cleanEvents, machines, period);
  setCachedSummary(cacheKey, summary);
  return summary;
}
