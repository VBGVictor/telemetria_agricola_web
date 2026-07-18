import type { EventGroup, MachineType } from "@prisma/client";
import type { RawEvent, RawMachine } from "../types/raw-data";

export const MACHINE_TYPE_BY_RAW_TYPE: Record<RawMachine["type"], MachineType> = {
  colhedora: "COLHEDORA",
  trator: "TRATOR",
  caminhao: "CAMINHAO",
};

export const RAW_TYPE_BY_MACHINE_TYPE: Record<MachineType, RawMachine["type"]> = {
  COLHEDORA: "colhedora",
  TRATOR: "trator",
  CAMINHAO: "caminhao",
};

export const EVENT_GROUP_BY_RAW_GROUP: Record<RawEvent["eventGroup"], EventGroup> = {
  Efetivo: "EFETIVO",
  Manobra: "MANOBRA",
  Deslocamento: "DESLOCAMENTO",
  Aguardando: "AGUARDANDO",
  "Manutenção": "MANUTENCAO",
};

export const RAW_GROUP_BY_EVENT_GROUP: Record<EventGroup, RawEvent["eventGroup"]> = {
  EFETIVO: "Efetivo",
  MANOBRA: "Manobra",
  DESLOCAMENTO: "Deslocamento",
  AGUARDANDO: "Aguardando",
  MANUTENCAO: "Manutenção",
};
