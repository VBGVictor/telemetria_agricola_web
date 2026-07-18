import type { Machine, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma-client";
import type { MachineListQuery } from "../schemas/machine-schema";
import { MACHINE_TYPE_BY_RAW_TYPE } from "../lib/enum-mappings";

export function findActiveMachines(filters: MachineListQuery): Promise<Machine[]> {
  const where: Prisma.MachineWhereInput = {
    deletedAt: null,
    ...(filters.type ? { type: MACHINE_TYPE_BY_RAW_TYPE[filters.type] } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { code: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.machine.findMany({ where, orderBy: { code: "asc" } });
}

export function findActiveMachineById(id: string): Promise<Machine | null> {
  return prisma.machine.findFirst({ where: { id, deletedAt: null } });
}

export function findMachinesByIds(ids: string[]): Promise<Machine[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return prisma.machine.findMany({ where: { id: { in: ids } } });
}

export function createMachine(data: Prisma.MachineCreateInput): Promise<Machine> {
  return prisma.machine.create({ data });
}

export function updateMachine(id: string, data: Prisma.MachineUpdateInput): Promise<Machine> {
  return prisma.machine.update({ where: { id }, data });
}

export function softDeleteMachine(id: string): Promise<Machine> {
  return prisma.machine.update({ where: { id }, data: { deletedAt: new Date() } });
}
