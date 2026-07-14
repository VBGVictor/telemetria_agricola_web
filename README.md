# Teste Técnico — Desenvolvedor(a) Pleno Web · Analitica

Bem-vindo(a)! Este é o teste técnico para a vaga de **desenvolvedor(a) pleno web** na Analitica.

Trabalhamos com **telemetria e analytics para operação agrícola**: recebemos apontamentos
de operadores e telemetria de máquinas no campo (colhedoras, tratores, caminhões) e
transformamos isso em painéis de monitoramento e indicadores de rendimento. O desafio
abaixo é uma versão em miniatura do nosso dia a dia real.

## O desafio

Construir um **mini painel de monitoramento de frota** com duas partes:

1. **API** (backend) que importa os dados deste repositório, expõe o cadastro de
   máquinas e calcula indicadores.
2. **Painel web** (frontend) que consome essa API.

Os dados estão em [`data/`](data/):

- [`machines.json`](data/machines.json) — cadastro de 12 máquinas.
- [`events.json`](data/events.json) — ~1.800 apontamentos de 7 dias (01 a 07/06/2026),
  cada um com `machineCode`, `eventGroup` (`Efetivo`, `Manobra`, `Deslocamento`,
  `Aguardando`, `Manutenção`), `startTime` e `endTime` em **UTC**.

> ⚠️ **Os dados contêm imperfeições de propósito** — exatamente como os dados reais que
> recebemos do campo: eventos ainda em aberto (`endTime: null`), eventos duplicados,
> eventos sobrepostos, eventos de máquina que não existe no cadastro e até horário
> invertido. **Parte do teste é decidir como tratar cada caso e documentar a decisão
> no seu README.** Não existe uma única resposta certa; existe decisão consciente.

## Stack obrigatória

É a mesma stack que usamos em produção — queremos ver você produtivo(a) nela:

| Camada | Tecnologias |
| --- | --- |
| Backend | Node.js 20+, **TypeScript**, **Express**, **Prisma** + **PostgreSQL**, **Zod** |
| Frontend | **Next.js 14** (React 18), **TypeScript**, **TailwindCSS**, **shadcn/ui** (Radix), **TanStack Query**, **React Hook Form** + **Zod** |
| Testes | **Vitest** |

Há um [`docker-compose.yml`](docker-compose.yml) neste repositório com um PostgreSQL
pronto para uso (`docker compose up -d`). Biblioteca de gráficos é de livre escolha
(usamos Recharts, mas não é obrigatório).

## Requisitos

### Parte 1 — Backend

1. **Modelagem + seed**: modele máquinas e eventos com Prisma e crie um script de seed
   que importe os JSONs de `data/`.
2. **CRUD de máquinas**:
   - `GET /machines` — lista com busca por nome/código e filtro por tipo.
   - `POST /machines` e `PUT /machines/:id` — com validação Zod (payload inválido → 400
     com mensagem útil).
   - `DELETE /machines/:id` — **soft-delete** (nunca apagamos linha de banco; máquina
     deletada some das listagens).
3. **Eventos por máquina**: `GET /machines/:id/events` com filtro por período
   (`from`/`to`) e **paginação**.
4. **Indicadores**: `GET /summary?from=...&to=...` retornando, **por máquina**:
   - horas por grupo de evento (2 casas decimais);
   - **horas totais**;
   - **disponibilidade** = (horas totais − horas de Manutenção) ÷ horas totais;
   - **eficiência** = horas de Efetivo ÷ horas totais.

   Regra da casa (obrigatória): **os totais e percentuais devem ser calculados a partir
   dos valores já arredondados que serão exibidos**, não dos valores crus — nosso QA
   confere as contas na mão e a soma da tela tem que bater.

### Parte 2 — Frontend

1. **Tela de máquinas**: tabela com busca e filtro por tipo; criar/editar em
   modal/drawer com React Hook Form + Zod (validação espelhando a do backend);
   excluir com confirmação.
2. **Dashboard** (com filtro de período dentro de 01–07/06/2026):
   - cards de resumo da frota (ex.: máquinas ativas, horas totais, disponibilidade
     média, eficiência média);
   - tabela de indicadores por máquina;
   - um gráfico de horas por grupo de evento ao longo dos dias.
3. Todo dado remoto via **TanStack Query**, com estados de **loading, erro e vazio**
   tratados (nada de tela branca se a API cair).
4. Datas em UTC no backend, **exibidas no fuso America/Sao_Paulo** no frontend.

### Parte 3 — Qualidade

1. **Testes com Vitest** cobrindo, no mínimo, o cálculo dos indicadores (incluindo os
   casos sujos: evento em aberto, duplicado, horário invertido...).
2. **README próprio** com: como rodar (backend, frontend, seed), decisões de
   arquitetura e **como você tratou cada imperfeição dos dados e por quê**.

## Convenções de código (obrigatórias)

São as convenções reais do nosso monorepo:

- **Sem classes** em TypeScript — funções e composição.
- `function declaration` para funções top-level exportadas; arrow functions para
  callbacks/inline.
- Arquivos em `kebab-case`, funções em `camelCase`, tipos em `PascalCase`,
  constantes em `SCREAMING_SNAKE_CASE`.
- **Sem `any`** — tipos explícitos.
- **Soft-delete** — toda tabela tem `created_at`, `updated_at`, `deleted_at`.
- **UTC no backend**, conversão de fuso só no frontend.
- Código em inglês; documentação pode ser em português.

## Diferenciais (não obrigatórios)

- Monorepo com workspaces (usamos Turborepo + Yarn 4).
- Docker Compose completo (API + web + banco) subindo tudo com um comando.
- TanStack Table na listagem.
- Testes de componente no frontend.
- Cache com degradação graciosa (ex.: cache em memória do `/summary` que, se falhar,
  recalcula do banco).

## Entrega

1. Crie um repositório **público** no seu GitHub (ou privado, convidando quem enviou o
   teste) — **não** abra PR neste repositório.
2. Commits pequenos e descritivos contam pontos: queremos ver **como** você constrói,
   não só o resultado final.
3. Prazo sugerido: **5 dias corridos** a partir do recebimento. Estimamos algo entre
   **8 e 12 horas** de trabalho — se faltar tempo, priorize qualidade sobre
   completude e registre no README o que ficou de fora e como faria.
4. Envie o link do repositório para quem te passou o teste.

Os critérios de avaliação estão públicos em [`AVALIACAO.md`](AVALIACAO.md).

Boa sorte! 🚜
