import { z } from "zod";

export const machineInputSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["colhedora", "trator", "caminhao"], {
    errorMap: () => ({ message: "Tipo deve ser colhedora, trator ou caminhao" }),
  }),
  model: z.string().min(1, "Modelo é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
  year: z.number().int().min(1990, "Ano deve ser 1990 ou posterior"),
});

export type MachineInput = z.infer<typeof machineInputSchema>;

export const machineListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  type: z.enum(["colhedora", "trator", "caminhao"]).optional(),
});

export type MachineListQuery = z.infer<typeof machineListQuerySchema>;
