import { Router } from "express";
import { getFleetSummary } from "../services/summary-service";
import { summaryQuerySchema } from "../schemas/query-schema";

export const summaryRouter = Router();

summaryRouter.get("/summary", async (req, res, next) => {
  try {
    const query = summaryQuerySchema.parse(req.query);
    const summary = await getFleetSummary(query);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});
