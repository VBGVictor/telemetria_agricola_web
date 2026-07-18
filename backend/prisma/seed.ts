import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { cleanEvents, type ImportReport } from "../src/data-cleaning/clean-events";
import { EVENT_GROUP_BY_RAW_GROUP, MACHINE_TYPE_BY_RAW_TYPE } from "../src/lib/enum-mappings";
import { rawEventSchema, rawMachineSchema, type RawEvent, type RawMachine } from "../src/types/raw-data";

const prisma = new PrismaClient();

function readRawMachines(): RawMachine[] {
  const filePath = resolve(import.meta.dirname, "../../data/machines.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return z.array(rawMachineSchema).parse(raw);
}

function readRawEvents(): RawEvent[] {
  const filePath = resolve(import.meta.dirname, "../../data/events.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return z.array(rawEventSchema).parse(raw);
}

function printImportReport(report: ImportReport): void {
  console.log("");
  console.log("== Relatório de importação ==");
  console.log(`Eventos lidos:                        ${report.totalEventosLidos}`);
  console.log(`Duplicatas removidas:                 ${report.duplicatasRemovidas}`);
  console.log(`Máquina fantasma (descartados):        ${report.maquinaFantasmaRemovidos}`);
  console.log(`Horário invertido (corrigidos):        ${report.horarioInvertidoCorrigido}`);
  console.log(`Eventos em aberto (mantidos):          ${report.eventosEmAberto}`);
  console.log(
    `Clusters de sobreposição excluídos:    ${report.clustersSobrepostos} (${report.eventosExcluidosPorSobreposicao} eventos)`
  );
  console.log(`Eventos válidos importados:            ${report.totalEventosValidos}`);
  console.log("");
}

async function main(): Promise<void> {
  const rawMachines = readRawMachines();
  const rawEvents = readRawEvents();

  const { events, report } = cleanEvents(rawEvents, rawMachines);

  await prisma.event.deleteMany();
  await prisma.machine.deleteMany();

  await prisma.machine.createMany({
    data: rawMachines.map((machine) => ({
      code: machine.code,
      name: machine.name,
      type: MACHINE_TYPE_BY_RAW_TYPE[machine.type],
      model: machine.model,
      brand: machine.brand,
      year: machine.year,
    })),
  });

  const insertedMachines = await prisma.machine.findMany();
  const machineIdByCode = new Map(insertedMachines.map((machine) => [machine.code, machine.id]));

  await prisma.event.createMany({
    data: events.map((event) => ({
      id: event.id,
      machineId: machineIdByCode.get(event.machineCode) as string,
      eventGroup: EVENT_GROUP_BY_RAW_GROUP[event.eventGroup],
      startTime: new Date(event.startTime),
      endTime: event.endTime ? new Date(event.endTime) : null,
    })),
  });

  printImportReport(report);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
