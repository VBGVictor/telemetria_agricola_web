import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cleanEvents } from "../data-cleaning/clean-events";
import type { RawEvent, RawMachine } from "../types/raw-data";
import { computeMachineSummary } from "./compute-summary";

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

describe("computeMachineSummary - casos isolados", () => {
  it("conta so a fatia do evento que cai dentro do periodo pedido", () => {
    const eventos = [
      buildEvent({
        id: "e1",
        startTime: "2026-06-01T22:00:00.000Z",
        endTime: "2026-06-02T03:00:00.000Z",
      }),
    ];

    const [resumo] = computeMachineSummary(eventos, machinesFixture, {
      from: "2026-06-02T00:00:00.000Z",
      to: "2026-06-02T06:00:00.000Z",
    });

    expect(resumo.hoursByGroup.Efetivo).toBe(3);
  });

  it("evento em aberto conta ate o fim do periodo pedido (to), nao alem", () => {
    const eventos = [buildEvent({ id: "e1", startTime: "2026-06-02T20:00:00.000Z", endTime: null })];

    const [resumo] = computeMachineSummary(eventos, machinesFixture, {
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-03T00:00:00.000Z",
    });

    expect(resumo.hoursByGroup.Efetivo).toBe(4);
  });

  it("evento totalmente fora do periodo nao conta nada", () => {
    const eventos = [buildEvent({ id: "e1", startTime: "2026-06-05T10:00:00.000Z", endTime: "2026-06-05T11:00:00.000Z" })];

    const [resumo] = computeMachineSummary(eventos, machinesFixture, {
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-02T00:00:00.000Z",
    });

    expect(resumo.totalHours).toBe(0);
  });

  it("soma os totais a partir dos valores ja arredondados (regra da casa)", () => {
    const eventos = [
      buildEvent({
        id: "e1",
        eventGroup: "Efetivo",
        startTime: "2026-06-01T00:00:00.000Z",
        endTime: "2026-06-01T01:40:00.000Z", // 100 minutos
      }),
      buildEvent({
        id: "e2",
        eventGroup: "Manobra",
        startTime: "2026-06-01T02:00:00.000Z",
        endTime: "2026-06-01T03:40:00.000Z", // 100 minutos
      }),
    ];

    const [resumo] = computeMachineSummary(eventos, machinesFixture, {
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-02T00:00:00.000Z",
    });

    // 100min = 1.6666...h -> arredonda pra 1.67h em cada grupo
    expect(resumo.hoursByGroup.Efetivo).toBe(1.67);
    expect(resumo.hoursByGroup.Manobra).toBe(1.67);
    // total tem que ser a SOMA dos arredondados (3.34), nao o arredondamento da soma bruta (3.33)
    expect(resumo.totalHours).toBe(3.34);
  });

  it("maquina sem nenhum evento no periodo aparece com tudo zerado, sem quebrar a conta", () => {
    const [resumo] = computeMachineSummary([], machinesFixture, {
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-02T00:00:00.000Z",
    });

    expect(resumo.totalHours).toBe(0);
    expect(resumo.availability).toBe(0);
    expect(resumo.efficiency).toBe(0);
  });
});

describe("computeMachineSummary - dataset real do desafio", () => {
  it("bate com os numeros conferidos manualmente pra maquina 6001, semana inteira", () => {
    const rawEvents: RawEvent[] = JSON.parse(
      readFileSync(resolve(__dirname, "../../../data/events.json"), "utf-8")
    );
    const rawMachines: RawMachine[] = JSON.parse(
      readFileSync(resolve(__dirname, "../../../data/machines.json"), "utf-8")
    );

    const { events } = cleanEvents(rawEvents, rawMachines);
    const resumo = computeMachineSummary(events, rawMachines, {
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-08T00:00:00.000Z",
    });

    const maquina6001 = resumo.find((item) => item.machineCode === "6001");

    expect(maquina6001?.hoursByGroup).toEqual({
      Efetivo: 98.25,
      Manobra: 2.35,
      Deslocamento: 10.75,
      Aguardando: 11.65,
      "Manutenção": 42,
    });
    expect(maquina6001?.totalHours).toBe(165);
    expect(maquina6001?.availability).toBe(0.7455);
    expect(maquina6001?.efficiency).toBe(0.5955);
  });
});
