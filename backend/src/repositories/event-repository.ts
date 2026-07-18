import type { Event as PrismaEvent } from "@prisma/client";
import { prisma } from "../lib/prisma-client";

export type EventWithMachineCode = PrismaEvent & { machine: { code: string } };

export async function findEventsByMachine(
  machineId: string,
  filters: { from?: Date; to?: Date; page: number; limit: number }
): Promise<{ events: PrismaEvent[]; total: number }> {
  const where = {
    machineId,
    deletedAt: null,
    ...(filters.from ? { startTime: { gte: filters.from } } : {}),
    ...(filters.to ? { startTime: { lte: filters.to } } : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startTime: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total };
}

export function findEventsOverlappingPeriod(from: Date, to: Date): Promise<EventWithMachineCode[]> {
  return prisma.event.findMany({
    where: {
      deletedAt: null,
      startTime: { lt: to },
      OR: [{ endTime: null }, { endTime: { gt: from } }],
    },
    include: { machine: { select: { code: true } } },
  });
}
