"use client";

import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchDailySummary, fetchMachines, fetchSummary } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventsChart } from "@/components/events-chart";
import { IndicatorsTable } from "@/components/indicators-table";
import { KpiCards } from "@/components/kpi-cards";
import { DEFAULT_PERIOD_VALUE, parsePeriod, PeriodSelect } from "@/components/period-select";

function DashboardContent() {
  const searchParams = useSearchParams();
  const periodValue = searchParams.get("periodo") ?? DEFAULT_PERIOD_VALUE;
  const period = parsePeriod(periodValue);

  const machinesQuery = useQuery({
    queryKey: ["machines", { search: undefined, type: undefined }],
    queryFn: () => fetchMachines({}),
  });

  const summaryQuery = useQuery({
    queryKey: ["summary", period],
    queryFn: () => fetchSummary(period),
  });

  const dailyQuery = useQuery({
    queryKey: ["summary-daily", period],
    queryFn: () => fetchDailySummary(period),
  });

  const isLoading = machinesQuery.isLoading || summaryQuery.isLoading || dailyQuery.isLoading;
  const isError = machinesQuery.isError || summaryQuery.isError || dailyQuery.isError;
  const errorMessage =
    (machinesQuery.error as Error)?.message ??
    (summaryQuery.error as Error)?.message ??
    (dailyQuery.error as Error)?.message;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard da frota</h1>
          <p className="text-sm text-muted-foreground">Indicadores do período selecionado</p>
        </div>
        <PeriodSelect />
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Não foi possível carregar o dashboard: {errorMessage}
        </div>
      )}

      {isLoading && !isError && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isLoading && !isError && machinesQuery.data && summaryQuery.data && (
        <>
          <KpiCards machines={machinesQuery.data} summary={summaryQuery.data} />

          <Card>
            <CardHeader>
              <CardTitle>Horas por grupo de evento</CardTitle>
              <CardDescription>Frota inteira, por dia (passe o mouse nas barras)</CardDescription>
            </CardHeader>
            <CardContent>
              <EventsChart days={dailyQuery.data ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicadores por máquina</CardTitle>
              <CardDescription>
                Horas com 2 casas — totais e percentuais derivados dos valores exibidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryQuery.data.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhum indicador para o período selecionado.
                </div>
              ) : (
                <IndicatorsTable machines={machinesQuery.data} summary={summaryQuery.data} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DashboardContent />
    </Suspense>
  );
}
