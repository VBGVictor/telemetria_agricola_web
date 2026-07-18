import type { RawEvent, RawMachine } from "../types/raw-data";

export type CleanEvent = RawEvent;

export type ImportReport = {
  totalEventosLidos: number;
  duplicatasRemovidas: number;
  maquinaFantasmaRemovidos: number;
  horarioInvertidoCorrigido: number;
  eventosEmAberto: number;
  clustersSobrepostos: number;
  eventosExcluidosPorSobreposicao: number;
  totalEventosValidos: number;
};

function dedupeById(events: RawEvent[]): { events: RawEvent[]; removidos: number } {
  const idsVistos = new Set<string>();
  const restantes: RawEvent[] = [];
  let removidos = 0;

  for (const event of events) {
    if (idsVistos.has(event.id)) {
      removidos++;
      continue;
    }
    idsVistos.add(event.id);
    restantes.push(event);
  }

  return { events: restantes, removidos };
}

function removePhantomMachineEvents(
  events: RawEvent[],
  machineCodes: Set<string>
): { events: RawEvent[]; removidos: number } {
  const restantes: RawEvent[] = [];
  let removidos = 0;

  for (const event of events) {
    if (machineCodes.has(event.machineCode)) {
      restantes.push(event);
    } else {
      removidos++;
    }
  }

  return { events: restantes, removidos };
}

function fixInvertedTimes(events: RawEvent[]): { events: RawEvent[]; corrigidos: number } {
  let corrigidos = 0;

  const resultado = events.map((event) => {
    if (event.endTime === null) return event;
    if (new Date(event.startTime) <= new Date(event.endTime)) return event;

    corrigidos++;
    return { ...event, startTime: event.endTime, endTime: event.startTime };
  });

  return { events: resultado, corrigidos };
}

function removeOverlapClusters(events: RawEvent[]): {
  events: RawEvent[];
  clusters: number;
  removidos: number;
} {
  const eventosPorMaquina = new Map<string, RawEvent[]>();
  for (const event of events) {
    const lista = eventosPorMaquina.get(event.machineCode) ?? [];
    lista.push(event);
    eventosPorMaquina.set(event.machineCode, lista);
  }

  const idsParaRemover = new Set<string>();
  let clusters = 0;

  for (const eventosDaMaquina of eventosPorMaquina.values()) {
    // eventos em aberto ficam de fora daqui: não dá pra comparar sobreposição
    // contra um evento que ainda não tem fim definido
    const comFim = eventosDaMaquina.filter((event) => event.endTime !== null);
    const ordenados = [...comFim].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let clusterAtual: RawEvent[] = [];
    let fimDoCluster: Date | null = null;

    const fecharCluster = () => {
      if (clusterAtual.length > 1) {
        clusters++;
        for (const event of clusterAtual) idsParaRemover.add(event.id);
      }
      clusterAtual = [];
    };

    for (const event of ordenados) {
      const inicio = new Date(event.startTime);
      const fim = new Date(event.endTime as string);

      if (fimDoCluster === null) {
        clusterAtual = [event];
        fimDoCluster = fim;
        continue;
      }

      if (inicio < fimDoCluster) {
        clusterAtual.push(event);
        if (fim > fimDoCluster) fimDoCluster = fim;
      } else {
        fecharCluster();
        clusterAtual = [event];
        fimDoCluster = fim;
      }
    }
    fecharCluster();
  }

  const restantes = events.filter((event) => !idsParaRemover.has(event.id));
  return { events: restantes, clusters, removidos: idsParaRemover.size };
}

export function cleanEvents(
  rawEvents: RawEvent[],
  machines: RawMachine[]
): { events: CleanEvent[]; report: ImportReport } {
  const machineCodes = new Set(machines.map((machine) => machine.code));

  const semDuplicata = dedupeById(rawEvents);
  const semFantasma = removePhantomMachineEvents(semDuplicata.events, machineCodes);
  const comHorarioCorrigido = fixInvertedTimes(semFantasma.events);
  const eventosEmAberto = comHorarioCorrigido.events.filter((event) => event.endTime === null).length;
  const semSobreposicao = removeOverlapClusters(comHorarioCorrigido.events);

  const report: ImportReport = {
    totalEventosLidos: rawEvents.length,
    duplicatasRemovidas: semDuplicata.removidos,
    maquinaFantasmaRemovidos: semFantasma.removidos,
    horarioInvertidoCorrigido: comHorarioCorrigido.corrigidos,
    eventosEmAberto,
    clustersSobrepostos: semSobreposicao.clusters,
    eventosExcluidosPorSobreposicao: semSobreposicao.removidos,
    totalEventosValidos: semSobreposicao.events.length,
  };

  return { events: semSobreposicao.events, report };
}
