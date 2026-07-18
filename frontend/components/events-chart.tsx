"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate, formatHours } from "@/lib/format";
import type { EventGroup } from "@/lib/types";

type DaySummary = {
  date: string;
  hoursByGroup: Record<EventGroup, number>;
  totalHours: number;
};

const GROUP_COLORS: Record<EventGroup, string> = {
  Efetivo: "#2a78d6",
  Manobra: "#1baf7a",
  Deslocamento: "#eda100",
  Aguardando: "#008300",
  "Manutenção": "#4a3aa7",
};

const GROUPS: EventGroup[] = ["Efetivo", "Manobra", "Deslocamento", "Aguardando", "Manutenção"];

export function EventsChart({ days }: { days: DaySummary[] }) {
  const data = days.map((day) => ({
    date: formatDate(`${day.date}T12:00:00.000Z`),
    ...day.hoursByGroup,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(value) => `${formatHours(Number(value))} h`} />
        <Legend />
        {GROUPS.map((group, index) => (
          <Bar
            key={group}
            dataKey={group}
            stackId="horas"
            fill={GROUP_COLORS[group]}
            radius={index === GROUPS.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
