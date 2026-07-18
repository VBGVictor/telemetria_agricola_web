import type { Event as PrismaEvent } from "@prisma/client";
import { findEventsByMachine } from "../repositories/event-repository";
import { getMachineById } from "./machine-service";
import type { EventsQuery } from "../schemas/query-schema";

export type PaginatedEvents = {
  events: PrismaEvent[];
  page: number;
  limit: number;
  total: number;
};

export async function listMachineEvents(machineId: string, query: EventsQuery): Promise<PaginatedEvents> {
  await getMachineById(machineId); // garante que a máquina existe e está ativa

  const { events, total } = await findEventsByMachine(machineId, {
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    page: query.page,
    limit: query.limit,
  });

  return { events, page: query.page, limit: query.limit, total };
}
