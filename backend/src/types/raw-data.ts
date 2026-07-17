import { z } from "zod";

export const rawMachineSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.enum(["colhedora", "trator", "caminhao"]),
  model: z.string(),
  brand: z.string(),
  year: z.number(),
});

export const rawEventSchema = z.object({
  id: z.string(),
  machineCode: z.string(),
  eventGroup: z.enum(["Efetivo", "Manobra", "Deslocamento", "Aguardando", "Manutenção"]),
  startTime: z.string(),
  endTime: z.string().nullable(),
});

export type RawMachine = z.infer<typeof rawMachineSchema>;
export type RawEvent = z.infer<typeof rawEventSchema>;
