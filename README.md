# 🚜 Analitica Frota — Mini Painel de Monitoramento

Solução desenvolvida por **Victor Goveia** para o teste técnico de Desenvolvedor(a) Pleno Web da
Analitica. O enunciado original do desafio está em [`DESAFIO.md`](DESAFIO.md) e os critérios de
avaliação em [`AVALIACAO.md`](AVALIACAO.md).

> Este README é construído em etapas, junto com o projeto — cada fase é commitada separadamente
> e a seção "Status do projeto" abaixo reflete o que já está pronto a cada momento.

## Status do projeto

- [x] Fase 0 — repositório configurado, documentação inicial
- [ ] Fase 1 — modelagem do banco de dados (Prisma)
- [ ] Fase 2 — seed com tratamento das imperfeições dos dados
- [ ] Fase 3 — cálculo de indicadores + testes
- [ ] Fase 4 — API (rotas / serviços / repositórios)
- [ ] Fase 5 — frontend (dashboard + tela de máquinas)
- [ ] Fase 6 — polimento final e revisão de convenções
- [ ] Diferencial — Docker Compose completo (API + web + banco)

## Sumário

- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Arquitetura e decisões técnicas](#arquitetura-e-decisões-técnicas)
- [Tratamento dos dados imperfeitos](#tratamento-dos-dados-imperfeitos)
- [Diferenciais implementados](#diferenciais-implementados)

## Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Node.js 20+, TypeScript, Express, Prisma + PostgreSQL, Zod |
| Frontend | Next.js 14 (React 18), TypeScript, TailwindCSS, shadcn/ui, TanStack Query, React Hook Form + Zod |
| Testes | Vitest |

## Como rodar

> ⚠️ Seção em construção 

Hoje, o único componente pronto é o banco de dados:

```bash
docker compose up -d
```

Isso sobe um PostgreSQL local em `localhost:5432` (usuário/senha/banco em
[`docker-compose.yml`](docker-compose.yml)). Os passos de backend, seed e frontend serão
adicionados aqui conforme cada fase for implementada.

## Arquitetura e decisões técnicas

- **Banco de dados isolado em schema próprio**: as tabelas do projeto estarão no schema Postgres
  `telemetria` (não no `public` padrão). O banco do `docker-compose.yml` é exclusivo e descartável, 
  mas estou simulando a prática que seria adotada caso este projeto precisasse dividir um banco com 
  outros sistemas da empresa, evitando colisão de nomes de tabelas com features de outros times.
- *(demais decisões de arquitetura serão documentadas aqui conforme cada fase avança)*

## Tratamento dos dados imperfeitos

Os dados em [`data/events.json`](data/events.json) contêm, de propósito, imperfeições típicas de
telemetria de campo. A tabela abaixo vai sendo preenchida **conforme cada imperfeição é encontrada
e tratada** no código (função de limpeza + testes da Fase 2/3) — a contagem que aparece
aqui é sempre a que sai rodando `yarn test`.

| Imperfeição | O que caracteriza | Quantas vezes apareceu | Decisão | Por quê |
| --- | --- | --- | --- | --- |
| Evento duplicado | Mesmo `id`, payload idêntico repetido no dataset | _[a preencher]_ | _[a preencher]_ | _[a preencher]_ |
| Máquina fantasma | `machineCode` do evento não existe no cadastro de máquinas | _[a preencher]_ | _[a preencher]_ | _[a preencher]_ |
| Horário invertido | `startTime` posterior ao `endTime` | _[a preencher]_ | _[a preencher]_ | _[a preencher]_ |
| Evento em aberto | `endTime: null` | _[a preencher]_ | _[a preencher]_ | _[a preencher]_ |
| Eventos sobrepostos | Períodos diferentes (não cópia exata) que se cruzam para a mesma máquina | _[a preencher]_ | _[a preencher]_ | _[a preencher]_ |


## Diferenciais implementados

_(a preencher conforme o que sobrar de tempo)_
