import { Prisma } from "@prisma/client";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { isNotFoundError } from "./lib/errors";
import { machinesRouter } from "./routes/machines-routes";
import { summaryRouter } from "./routes/summary-routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use(machinesRouter);
app.use(summaryRouter);

// precisa dos 4 parâmetros (mesmo os que não usa): é assim que o Express
// reconhece que essa função é um middleware de tratamento de erro
function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Payload inválido", details: error.flatten().fieldErrors });
    return;
  }

  if (isNotFoundError(error)) {
    res.status(404).json({ error: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const fields = (error.meta?.target as string[] | undefined)?.join(", ") ?? "campo";
    res.status(400).json({ error: `Já existe um registro com esse valor em: ${fields}` });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Erro interno" });
}

app.use(errorHandler);
