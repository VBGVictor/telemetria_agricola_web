export type MachineType = "colhedora" | "trator" | "caminhao";

export type Machine = {
  id: string;
  code: string;
  name: string;
  type: MachineType;
  model: string;
  brand: string;
  year: number;
};

export type EventGroup = "Efetivo" | "Manobra" | "Deslocamento" | "Aguardando" | "Manutenção";

export type MachineEvent = {
  id: string;
  machineId: string;
  eventGroup: string;
  startTime: string;
  endTime: string | null;
};

export type PaginatedEvents = {
  events: MachineEvent[];
  page: number;
  limit: number;
  total: number;
};

export type MachineSummary = {
  machineCode: string;
  hoursByGroup: Record<EventGroup, number>;
  totalHours: number;
  availability: number;
  efficiency: number;
};

export type DaySummary = {
  date: string;
  hoursByGroup: Record<EventGroup, number>;
  totalHours: number;
};

export type ApiErrorBody = {
  error: string;
  details?: Record<string, string[]>;
};
