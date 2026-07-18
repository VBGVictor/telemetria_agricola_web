import type { Event as PrismaEvent } from "@prisma/client";
import { findEventsByMachine } from "../repositories/event-repository";
import { getMachineById } from "./machine-service";
import { RAW_GROUP_BY_EVENT_GROUP } from "../lib/enum-mappings";
import type { EventsQuery } from "../schemas/query-schema";
import type { RawEvent } from "../types/raw-data";

export type EventResponse = Omit<PrismaEvent, "eventGroup"> & { eventGroup: RawEvent["eventGroup"] };

export type PaginatedEvents = {
  events: EventResponse[];
  page: number;
  limit: number;
  total: number;
};

// mesma ideia do tradutor de Machine.type em machine-service.ts: o enum do
// Prisma (EFETIVO, sem acento) volta pro formato "de fora" (Efetivo)
function serializeEvent(event: PrismaEvent): EventResponse {
  return { ...event, eventGroup: RAW_GROUP_BY_EVENT_GROUP[event.eventGroup] };
}

export async function listMachineEvents(machineId: string, query: EventsQuery): Promise<PaginatedEvents> {
  await getMachineById(machineId); // garante que a máquina existe e está ativa

  const { events, total } = await findEventsByMachine(machineId, {
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    page: query.page,
    limit: query.limit,
  });

  return { events: events.map(serializeEvent), page: query.page, limit: query.limit, total };
}
