const TIMEZONE = "America/Sao_Paulo";

// backend sempre manda data em UTC — a conversão de fuso só acontece aqui,
// na hora de exibir, nunca antes disso
export function formatDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    dateStyle: "short",
  }).format(new Date(isoDate));
}

export function formatHours(value: number): string {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value
  );
}

export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    ratio
  );
}

export const MACHINE_TYPE_LABEL: Record<string, string> = {
  colhedora: "Colhedora",
  trator: "Trator",
  caminhao: "Caminhão",
};

// plural irregular em português — "trator" -> "tratores", "caminhão" -> "caminhões",
// não dá pra só acrescentar "s" como em inglês
export const MACHINE_TYPE_LABEL_PLURAL: Record<string, string> = {
  colhedora: "colhedoras",
  trator: "tratores",
  caminhao: "caminhões",
};
