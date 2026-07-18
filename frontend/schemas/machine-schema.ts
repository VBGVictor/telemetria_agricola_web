import { z } from "zod";

// espelha backend/src/schemas/machine-schema.ts — sem monorepo, os dois lados
// mantêm as mesmas regras escritas separadamente
export const machineFormSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["colhedora", "trator", "caminhao"], {
    errorMap: () => ({ message: "Selecione um tipo" }),
  }),
  model: z.string().min(1, "Modelo é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
  year: z.number({ invalid_type_error: "Ano é obrigatório" }).int().min(1990, "Ano deve ser 1990 ou posterior"),
});

export type MachineFormValues = z.infer<typeof machineFormSchema>;
