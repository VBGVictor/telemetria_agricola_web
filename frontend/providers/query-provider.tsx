"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            // 'online' (padrão) pausa a query em vez de declarar erro quando o
            // navegador acha que está sem rede — isso deixa a tela sem loading
            // e sem mensagem de erro (nem isLoading nem isError ficam true).
            // 'always' garante que toda falha de rede vira isError de verdade.
            networkMode: "always",
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
