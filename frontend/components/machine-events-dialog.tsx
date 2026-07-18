"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMachineEvents } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { Machine } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 10;

export function MachineEventsDialog({
  open,
  onOpenChange,
  machine,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
}) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["machine-events", machine?.id, page],
    queryFn: () => fetchMachineEvents(machine!.id, { page, limit: PAGE_SIZE }),
    enabled: open && machine !== null,
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setPage(1);
    onOpenChange(nextOpen);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Eventos — {machine?.name}</DialogTitle>
          <DialogDescription>
            Horários exibidos em America/Sao_Paulo (o backend guarda tudo em UTC).
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="grid gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Não foi possível carregar os eventos dessa máquina.
          </div>
        )}

        {!isLoading && !isError && data && data.events.length === 0 && (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum evento registrado.
          </div>
        )}

        {!isLoading && !isError && data && data.events.length > 0 && (
          <div className="grid gap-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.eventGroup}</TableCell>
                    <TableCell>{formatDateTime(event.startTime)}</TableCell>
                    <TableCell>{event.endTime ? formatDateTime(event.endTime) : "Em aberto"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Página {page} de {totalPages} · {data.total} evento(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
