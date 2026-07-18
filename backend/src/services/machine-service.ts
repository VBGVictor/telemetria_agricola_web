import type { Machine } from "@prisma/client";
import { createNotFoundError } from "../lib/errors";
import {
  createMachine,
  findActiveMachineById,
  findActiveMachines,
  softDeleteMachine,
  updateMachine,
} from "../repositories/machine-repository";
import { MACHINE_TYPE_BY_RAW_TYPE, RAW_TYPE_BY_MACHINE_TYPE } from "../lib/enum-mappings";
import type { MachineInput, MachineListQuery } from "../schemas/machine-schema";
import type { RawMachine } from "../types/raw-data";

export type MachineResponse = Omit<Machine, "type"> & { type: RawMachine["type"] };

// converte o enum do Prisma (COLHEDORA, sem acento nem minúscula) de volta pro
// formato "de fora" que a API e o frontend usam (colhedora) — mesma ideia do
// tradutor que já existe pros eventos em summary-service.ts
function serializeMachine(machine: Machine): MachineResponse {
  return { ...machine, type: RAW_TYPE_BY_MACHINE_TYPE[machine.type] };
}

export async function listMachines(filters: MachineListQuery): Promise<MachineResponse[]> {
  const machines = await findActiveMachines(filters);
  return machines.map(serializeMachine);
}

export async function getMachineById(id: string): Promise<Machine> {
  const machine = await findActiveMachineById(id);
  if (!machine) throw createNotFoundError(`Máquina ${id} não encontrada`);
  return machine;
}

export async function registerMachine(input: MachineInput): Promise<MachineResponse> {
  const machine = await createMachine({
    code: input.code,
    name: input.name,
    type: MACHINE_TYPE_BY_RAW_TYPE[input.type],
    model: input.model,
    brand: input.brand,
    year: input.year,
  });
  return serializeMachine(machine);
}

export async function editMachine(id: string, input: MachineInput): Promise<MachineResponse> {
  await getMachineById(id); // garante que existe e está ativa, ou lança NotFoundError

  const machine = await updateMachine(id, {
    code: input.code,
    name: input.name,
    type: MACHINE_TYPE_BY_RAW_TYPE[input.type],
    model: input.model,
    brand: input.brand,
    year: input.year,
  });
  return serializeMachine(machine);
}

export async function removeMachine(id: string): Promise<void> {
  await getMachineById(id); // garante que existe e está ativa, ou lança NotFoundError
  await softDeleteMachine(id);
}
