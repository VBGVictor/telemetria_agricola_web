import { Router } from "express";
import { editMachine, listMachines, registerMachine, removeMachine } from "../services/machine-service";
import { listMachineEvents } from "../services/event-service";
import { machineInputSchema, machineListQuerySchema } from "../schemas/machine-schema";
import { eventsQuerySchema } from "../schemas/query-schema";

export const machinesRouter = Router();

machinesRouter.get("/machines", async (req, res, next) => {
  try {
    const query = machineListQuerySchema.parse(req.query);
    const machines = await listMachines(query);
    res.json(machines);
  } catch (error) {
    next(error);
  }
});

machinesRouter.post("/machines", async (req, res, next) => {
  try {
    const input = machineInputSchema.parse(req.body);
    const machine = await registerMachine(input);
    res.status(201).json(machine);
  } catch (error) {
    next(error);
  }
});

machinesRouter.put("/machines/:id", async (req, res, next) => {
  try {
    const input = machineInputSchema.parse(req.body);
    const machine = await editMachine(req.params.id, input);
    res.json(machine);
  } catch (error) {
    next(error);
  }
});

machinesRouter.delete("/machines/:id", async (req, res, next) => {
  try {
    await removeMachine(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

machinesRouter.get("/machines/:id/events", async (req, res, next) => {
  try {
    const query = eventsQuerySchema.parse(req.query);
    const result = await listMachineEvents(req.params.id, query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
