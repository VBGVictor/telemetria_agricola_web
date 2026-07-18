import type { Machine } from "@prisma/client";
import { createNotFoundError } from "../lib/errors";
import {
  createMachine,
  findActiveMachineById,
  findActiveMachines,
  softDeleteMachine,
  updateMachine,
} from "../repositories/machine-repository";
import { MACHINE_TYPE_BY_RAW_TYPE } from "../lib/enum-mappings";
import type { MachineInput, MachineListQuery } from "../schemas/machine-schema";

export function listMachines(filters: MachineListQuery): Promise<Machine[]> {
  return findActiveMachines(filters);
}

export async function getMachineById(id: string): Promise<Machine> {
  const machine = await findActiveMachineById(id);
  if (!machine) throw createNotFoundError(`Máquina ${id} não encontrada`);
  return machine;
}

export function registerMachine(input: MachineInput): Promise<Machine> {
  return createMachine({
    code: input.code,
    name: input.name,
    type: MACHINE_TYPE_BY_RAW_TYPE[input.type],
    model: input.model,
    brand: input.brand,
    year: input.year,
  });
}

export async function editMachine(id: string, input: MachineInput): Promise<Machine> {
  await getMachineById(id); // garante que existe e está ativa, ou lança NotFoundError

  return updateMachine(id, {
    code: input.code,
    name: input.name,
    type: MACHINE_TYPE_BY_RAW_TYPE[input.type],
    model: input.model,
    brand: input.brand,
    year: input.year,
  });
}

export async function removeMachine(id: string): Promise<void> {
  await getMachineById(id); // garante que existe e está ativa, ou lança NotFoundError
  await softDeleteMachine(id);
}
