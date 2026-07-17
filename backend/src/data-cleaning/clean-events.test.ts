import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RawEvent, RawMachine } from "../types/raw-data";
import { cleanEvents } from "./clean-events";

const machinesFixture: RawMachine[] = [
  { code: "6001", name: "Colhedora 6001", type: "colhedora", model: "CH570", brand: "John Deere", year: 2021 },
];

function buildEvent(overrides: Partial<RawEvent>): RawEvent {
  return {
    id: "evt-base",
    machineCode: "6001",
    eventGroup: "Efetivo",
    startTime: "2026-06-01T10:00:00.000Z",
    endTime: "2026-06-01T11:00:00.000Z",
    ...overrides,
  };
}

describe("cleanEvents - casos isolados", () => {
  it("remove evento duplicado (mesmo id repetido)", () => {
    const eventos = [buildEvent({ id: "evt-1" }), buildEvent({ id: "evt-1" })];

    const { events, report } = cleanEvents(eventos, machinesFixture);

    expect(events).toHaveLength(1);
    expect(report.duplicatasRemovidas).toBe(1);
  });

  it("descarta evento de maquina fantasma (codigo fora do cadastro)", () => {
    const eventos = [buildEvent({ id: "evt-1", machineCode: "9999" })];

    const { events, report } = cleanEvents(eventos, machinesFixture);

    expect(events).toHaveLength(0);
    expect(report.maquinaFantasmaRemovidos).toBe(1);
  });

  it("corrige horario invertido trocando start e end", () => {
    const eventos = [
      buildEvent({
        id: "evt-1",
        startTime: "2026-06-01T11:00:00.000Z",
        endTime: "2026-06-01T10:00:00.000Z",
      }),
    ];

    const { events, report } = cleanEvents(eventos, machinesFixture);

    expect(events[0].startTime).toBe("2026-06-01T10:00:00.000Z");
    expect(events[0].endTime).toBe("2026-06-01T11:00:00.000Z");
    expect(report.horarioInvertidoCorrigido).toBe(1);
  });

  it("mantem evento em aberto sem inventar um endTime", () => {
    const eventos = [buildEvent({ id: "evt-1", endTime: null })];

    const { events, report } = cleanEvents(eventos, machinesFixture);

    expect(events).toHaveLength(1);
    expect(events[0].endTime).toBeNull();
    expect(report.eventosEmAberto).toBe(1);
  });

  it("exclui o cluster inteiro quando eventos se cruzam em cadeia, mesmo sem o primeiro e o ultimo se tocarem direto", () => {
    const eventos = [
      buildEvent({ id: "evt-a", startTime: "2026-06-01T08:00:00.000Z", endTime: "2026-06-01T09:00:00.000Z" }),
      buildEvent({ id: "evt-b", startTime: "2026-06-01T08:30:00.000Z", endTime: "2026-06-01T10:00:00.000Z" }),
      buildEvent({ id: "evt-c", startTime: "2026-06-01T09:45:00.000Z", endTime: "2026-06-01T10:30:00.000Z" }),
    ];

    const { events, report } = cleanEvents(eventos, machinesFixture);

    expect(events).toHaveLength(0);
    expect(report.clustersSobrepostos).toBe(1);
    expect(report.eventosExcluidosPorSobreposicao).toBe(3);
  });

  it("nao mexe em eventos sem nenhum problema", () => {
    const eventos = [buildEvent({ id: "evt-1" })];

    const { events, report } = cleanEvents(eventos, machinesFixture);

    expect(events).toHaveLength(1);
    expect(report.totalEventosValidos).toBe(1);
  });
});

describe("cleanEvents - dataset real do desafio", () => {
  it("bate com os numeros conferidos manualmente no dataset de data/", () => {
    const rawEvents: RawEvent[] = JSON.parse(
      readFileSync(resolve(__dirname, "../../../data/events.json"), "utf-8")
    );
    const rawMachines: RawMachine[] = JSON.parse(
      readFileSync(resolve(__dirname, "../../../data/machines.json"), "utf-8")
    );

    const { report } = cleanEvents(rawEvents, rawMachines);

    expect(report.duplicatasRemovidas).toBe(3);
    expect(report.maquinaFantasmaRemovidos).toBe(6);
    expect(report.horarioInvertidoCorrigido).toBe(1);
    expect(report.eventosEmAberto).toBe(3);
    expect(report.clustersSobrepostos).toBe(1);
    expect(report.eventosExcluidosPorSobreposicao).toBe(7);
  });
});
