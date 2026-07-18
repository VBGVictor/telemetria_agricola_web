"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchMachines } from "@/lib/api-client";
import { MACHINE_TYPE_LABEL } from "@/lib/format";
import type { Machine } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MachineFormDialog } from "@/components/machine-form-dialog";
import { DeleteMachineDialog } from "@/components/delete-machine-dialog";

export default function MaquinasPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

  const { data: machines, isLoading, isError, error } = useQuery({
    queryKey: ["machines", { search, type }],
    queryFn: () => fetchMachines({ search: search || undefined, type: type === "all" ? undefined : type }),
  });

  function openCreate() {
    setEditingMachine(null);
    setFormOpen(true);
  }

  function openEdit(machine: Machine) {
    setEditingMachine(machine);
    setFormOpen(true);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Máquinas</h1>
          <p className="text-sm text-muted-foreground">Cadastro da frota</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-xs"
            />
            <Select value={type} onValueChange={(value) => setType(value ?? "all")}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="colhedora">Colhedora</SelectItem>
                <SelectItem value="trator">Trator</SelectItem>
                <SelectItem value="caminhao">Caminhão</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button onClick={openCreate}>+ Nova máquina</Button>
          </div>

          {isLoading && (
            <div className="grid gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Não foi possível carregar as máquinas: {error.message}
            </div>
          )}

          {!isLoading && !isError && machines && machines.length === 0 && (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma máquina encontrada.
            </div>
          )}

          {!isLoading && !isError && machines && machines.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-right">Ano</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium">{machine.code}</TableCell>
                      <TableCell>{machine.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{MACHINE_TYPE_LABEL[machine.type]}</Badge>
                      </TableCell>
                      <TableCell>{machine.model}</TableCell>
                      <TableCell>{machine.brand}</TableCell>
                      <TableCell className="text-right">{machine.year}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(machine)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeletingMachine(machine)}
                        >
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MachineFormDialog open={formOpen} onOpenChange={setFormOpen} machine={editingMachine} />
      <DeleteMachineDialog
        open={deletingMachine !== null}
        onOpenChange={(open) => !open && setDeletingMachine(null)}
        machine={deletingMachine}
      />
    </div>
  );
}
