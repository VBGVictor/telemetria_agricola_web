import { z } from "zod";

export const eventsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type EventsQuery = z.infer<typeof eventsQuerySchema>;

export const summaryQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
