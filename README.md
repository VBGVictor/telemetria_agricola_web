# 🚜 Analitica Frota — Mini Painel de Monitoramento

Solução desenvolvida por **Victor Goveia** para o teste técnico de Desenvolvedor(a) Pleno Web da
Analitica. O enunciado original do desafio está em [`DESAFIO.md`](DESAFIO.md) e os critérios de
avaliação em [`AVALIACAO.md`](AVALIACAO.md).

> Este README é construído em etapas, junto com o projeto — cada fase é commitada separadamente
> e a seção "Status do projeto" abaixo reflete o que já está pronto a cada momento.

## Status do projeto

- [x] Fase 0 — repositório configurado, documentação inicial
- [x] Fase 1 — modelagem do banco de dados (Prisma)
- [x] Fase 2 — seed com tratamento das imperfeições dos dados
- [x] Fase 3 — cálculo de indicadores + testes
- [x] Fase 4 — API (rotas / serviços / repositórios)
- [x] Fase 5 — frontend (dashboard + tela de máquinas)
- [ ] Fase 6 — polimento final e revisão de convenções
- [ ] Diferencial — Docker Compose completo (API + web + banco)

## Sumário

- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Como verificar](#como-verificar)
- [Arquitetura e decisões técnicas](#arquitetura-e-decisões-técnicas)
- [Tratamento dos dados imperfeitos](#tratamento-dos-dados-imperfeitos)
- [Endpoints da API](#endpoints-da-api)
- [Diferenciais implementados](#diferenciais-implementados)
- [Ideias de evolução futura](#ideias-de-evolução-futura)

## Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Node.js 20+, TypeScript, Express, Prisma + PostgreSQL, Zod |
| Frontend | Next.js 14 (React 18), TypeScript, TailwindCSS, shadcn/ui, TanStack Query, React Hook Form + Zod |
| Testes | Vitest |

## Como rodar

Pré-requisitos: **Node.js 20+**, **npm** e **Docker** (com Docker Compose) instalados e rodando.

```bash
# 1. Banco de dados
docker compose up -d

# 2. Backend — instala dependências e aplica as migrations do Prisma
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
```

Isso sobe um PostgreSQL local em `localhost:5433` (usuário/senha/banco em
[`docker-compose.yml`](docker-compose.yml)) e cria as tabelas do projeto.

```bash
# 3. Seed — limpa os dados de data/ e importa pro banco
npx prisma db seed
```

O seed imprime um relatório no terminal (quantos eventos foram lidos, quantos descartados/corrigidos
e por quê).

```bash
# 4. Testes — não precisa de banco rodando, é tudo isolado
npm test
```

```bash
# 5. API — sobe em http://localhost:3333
npm run dev
```

```bash
# 6. Frontend — em outro terminal, na raiz do projeto
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000` (redireciona pro dashboard). Precisa da API (passo 5) rodando ao mesmo
tempo — o frontend consome ela via `NEXT_PUBLIC_API_URL`.

## Como verificar

Duas frentes — uma mecânica (roda sozinha, não depende da minha palavra) e outra manual (testei ao
vivo, registrada aqui e no histórico do projeto):

**Mecânico** — dentro de `backend/` e de `frontend/`:

```bash
npm run verify
```

Roda `typecheck` (TypeScript, incluindo `noUnusedLocals`/`noUnusedParameters` pra pegar código morto) +
`lint` (ESLint com `@typescript-eslint/no-explicit-any`, `no-restricted-syntax` bloqueando `class`, e
`no-console`) + no backend também `test` (Vitest). Sai com erro se qualquer convenção do enunciado for
violada — qualquer pessoa confirma sozinha, sem precisar confiar em mim.

**Manual** — testado ao vivo durante o desenvolvimento:

- CRUD completo de máquinas (criar, editar, excluir com confirmação), busca e filtro por tipo.
- Dashboard: cards de resumo, gráfico por dia, tabela de indicadores.
- API fora do ar: telas de Máquinas e Dashboard mostram erro tratado (sem tela branca, sem crash).
- Conversão de fuso horário: horários dos eventos (tela "Eventos" na listagem de máquinas) exibidos em
  America/Sao_Paulo, conferido contra o horário UTC cru devolvido pela API.

## Arquitetura e decisões técnicas

- **Banco de dados isolado em schema próprio**: as tabelas do projeto estão no schema Postgres
  `telemetria` (não no `public` padrão). O banco do `docker-compose.yml` é exclusivo e descartável,
  mas estou simulando a prática que seria adotada caso este projeto precisasse dividir um banco com
  outros sistemas da empresa, evitando colisão de nomes de tabelas com features de outros times.
- **Chave interna (`id`) separada do código de negócio (`code`) em `Machine`**: o `id` é gerado
  internamente (uuid) e nunca muda; o `code` é o identificador que já vem do cadastro (`"6001"`).
  As rotas (`PUT /machines/:id`) usam o `id` interno, não o `code`.
- **`Event.id` reaproveita o `id` original do JSON** (`"evt-01345"`) como chave primária, em vez de
  gerar um novo. Isso faz o próprio banco recusar automaticamente uma tentativa de inserir o mesmo
  evento duas vezes — uma segunda camada de proteção contra evento duplicado, além da limpeza feita
  no código.
- **`Event.machineId` referencia o `id` interno da máquina (chave estrangeira)**, não o `machineCode`
  em texto livre. Consequência: o seed precisa resolver `machineCode → Machine.id` antes de inserir
  um evento; se o código não existir no cadastro, a inserção falha — o banco reforça sozinho a regra
  de "sem máquina fantasma".
- **`Event.endTime` é opcional (nulo permitido)**: o banco guarda o dado exatamente como ele chega,
  inclusive quando o evento ainda está em aberto. O tratamento desse caso (limitar ao período
  consultado) acontece no cálculo do `/summary`, não altera o dado de origem.
- **`@map` nos valores de enum**: os nomes usados no código (`MANUTENCAO`, sem acento) são diferentes
  do valor gravado no banco (`Manutenção`, com acento) porque o Prisma não aceita caractere acentuado
  em nome de enum — é regra de sintaxe, não escolha estética. O `@map` garante que o valor salvo bate
  exatamente com o dado original do JSON.
- **Resolução de `machineCode → machineId` com carregamento único**: as 12 máquinas são carregadas numa
  única consulta e guardadas em memória (`Map`) antes de resolver os eventos, evitando uma consulta ao
  banco por evento (problema N+1). Funciona bem nessa escala; com uma tabela de máquinas muito maior,
  a estratégia poderia mudar para um `JOIN` feito direto no banco (via tabela de staging) ou um cache
  limitado, em vez de carregar tudo de uma vez.
- **Validação Zod na leitura do JSON bruto**: antes de qualquer limpeza, o formato dos arquivos em
  `data/` é validado — é uma fronteira com dado externo, então falha aqui, com mensagem clara, se o
  arquivo vier num formato inesperado.
- **Seed idempotente**: o script limpa (`deleteMany`) as tabelas antes de inserir de novo. Rodar o seed
  várias vezes sempre resulta no mesmo estado, sem duplicar nem acumular dado de execuções antigas.
- **Corte (clip) de evento no período consultado**: todo evento tem sua duração calculada apenas na
  fatia que cai dentro do `from`/`to` pedido — início efetivo é o maior entre o início real do evento e
  o `from`; fim efetivo é o menor entre o fim real (ou o `to`, se o evento estiver em aberto) e o `to`.
  Isso resolve o caso do evento em aberto e qualquer evento que cruze a borda do período, sem alterar o
  dado guardado no banco.
- **Regra de arredondamento**: cada grupo de evento é arredondado pra 2 casas primeiro; horas totais,
  disponibilidade e eficiência são calculadas a partir desses valores já arredondados, nunca do bruto —
  garante que a soma exibida sempre bate com a conta feita a partir dos números mostrados na tela.
- **Limitação conhecida: sobreposição não é checada contra eventos em aberto**: a checagem de cluster de
  sobreposição só compara eventos que já têm `endTime` definido — não é possível comparar intervalo
  contra um evento que ainda não terminou. Se um evento em aberto realmente se sobrepusesse com um
  evento fechado da mesma máquina, isso não seria detectado. Conferido no dataset deste teste: não afeta
  nenhum resultado atual. Se precisasse fechar essa lacuna, a abordagem seria tratar o fim de um evento
  em aberto como o instante mais tarde conhecido, só para essa checagem específica.
- **Três camadas (routes / services / repositories)**: rota só valida com Zod e formata resposta;
  service tem a regra de negócio; repository é o único lugar que fala com o Prisma direto — é lá que
  mora o filtro `deletedAt: null`, então nenhuma rota corre o risco de esquecê-lo.
- **`/summary` com máquina excluída — modelo híbrido**: o indicador por período inclui uma máquina
  excluída se ela teve evento dentro da janela pedida (é histórico, não muda depois); `GET /machines`
  (a listagem "atual") continua excluindo. A implementação busca as máquinas ativas e, separadamente,
  só as máquinas excluídas que aparecem nos eventos do período consultado.
- **`DELETE` numa máquina já excluída devolve `404`**, não um novo sucesso — mantém consistente com
  toda outra rota, que trata máquina excluída como "não encontrada".
- **Pendência em aberto: `code` de máquina excluída não pode ser reaproveitado**. `Machine.code` é
  `@unique` no banco, e essa trava não sabe nada sobre soft-delete — uma máquina excluída continua
  "segurando" o código dela pra sempre, então tentar cadastrar uma máquina nova com o mesmo código de
  uma já excluída falha (agora com `400` e mensagem clara, antes caía como `500` genérico — isso já
  corrigi). A decisão de negócio (permitir reaproveitar o código depois que a máquina é excluída, ou
  aposentar o código pra sempre) ainda não foi tomada — fica registrada aqui como algo a discutir,
  não como bug pendente de resolver por conta própria.
- **Erro customizado sem `class`**: como a convenção do projeto proíbe classe, o erro de "não
  encontrado" é um `Error` comum marcado com uma propriedade (`isNotFoundError`), não uma classe
  estendendo `Error`.
- **`/summary/daily` — descoberto faltando já na Fase 5**: o `/summary` original só devolve total por
  máquina no período inteiro; o gráfico do dashboard pede horas por dia. Adicionei
  `computeDailySummary` reaproveitando os mesmos helpers de corte e arredondamento já testados, só
  agrupando por dia (frota inteira) em vez de por máquina.
- **shadcn/ui gerado para uma stack mais nova do que a pedida**: a CLI (`npx shadcn@latest`) instalou
  componentes construídos em cima do `@base-ui/react` (biblioteca headless mais nova) e Tailwind v4,
  em vez do Radix UI clássico que combina com Next 14/React 18/Tailwind v3 (a stack exigida). Isso
  quebrou CSS (`border-border`, `outline-ring/50` não existiam), fontes (`Geist` via `next/font/google`
  indisponível nessa versão do Next) e o próprio comportamento de diálogo/select (bugs intermitentes de
  interação). Reescrevi `button`, `input`, `badge`, `dialog`, `select` usando Radix UI clássico
  (`@radix-ui/react-dialog`, `@radix-ui/react-select` etc.) e troquei as variáveis de cor de `oklch()`
  cru para o formato HSL clássico do shadcn v3, que suporta modificador de opacidade
  (`bg-destructive/10`) do jeito que o Tailwind v3 espera. `table` e `skeleton` já eram HTML puro e não
  precisaram de ajuste — **`card` não**: passou despercebido na Fase 5 e só foi pego na Fase 6 (ver
  item abaixo sobre o card "comendo" texto). Esse problema não foi identificado de imediato — o primeiro sinal
  (a CLI não gerando o `form.tsx`) foi tratado como caso isolado, e só depois de várias outras quebras
  (fonte, CSS, comportamento de modal) ficou claro que era a mesma causa raiz. Isso gerou um atraso
  real na Fase 5 até identificar e corrigir a origem do problema, em vez de só os sintomas.
- **Zod e `@hookform/resolvers` fixados na mesma major do backend**: a instalação padrão trouxe Zod v4
  no frontend (API diferente da v3 que o backend usa) — fixei `zod@3.23.8` (igual ao backend) e
  `@hookform/resolvers@3` (a versão compatível com Zod v3), pra validação de frontend e backend
  realmente falarem a mesma língua, como o enunciado pede.
- **Convenções (sem `any`, sem `class`, sem `console.log`, sem código morto) viram regra de ferramenta,
  não promessa**: em vez de só revisão manual, `.eslintrc.json` (backend e frontend) trava
  `@typescript-eslint/no-explicit-any`, `no-restricted-syntax` (bloqueia `class`/`class expression`) e
  `no-console` como erro de lint; `tsconfig.json` dos dois lados liga `noUnusedLocals` e
  `noUnusedParameters` pra pegar variável/import morto no typecheck. `npm run verify` (`typecheck` +
  `lint` + testes no backend) roda tudo de uma vez — ver [Como verificar](#como-verificar). Duas
  exceções documentadas: `prisma/seed.ts` tem `no-console` desligado via `overrides` (o relatório
  impresso no fim é saída intencional de uma ferramenta de linha de comando, não debug esquecido); o
  middleware de erro em `app.ts` pode usar `console.error` (`no-console` permite só esse), porque sem
  logar o erro 500 real ele fica invisível em produção — bem diferente de um `console.log` de debug.
- **Bug real encontrado testando ao vivo: `GET /machines/:id/events` devolvia o enum cru do Prisma**
  (`"EFETIVO"`, sem acento) em vez do valor de negócio (`"Efetivo"`). Era a mesma classe de bug já
  corrigida pra `Machine.type` em `machine-service.ts`, só que faltou replicar em `event-service.ts`.
  Corrigido com o mesmo padrão (`serializeEvent` traduzindo via `RAW_GROUP_BY_EVENT_GROUP`) — só foi
  descoberto porque testei a tela de eventos no navegador, não por revisão de código.
- **Fonte Geist carregada mas nunca conectada ao Tailwind**: `layout.tsx` carrega os arquivos da fonte
  via `next/font/local` e define `--font-geist-sans`, mas `tailwind.config.ts` não tinha
  `theme.fontFamily.sans` apontando pra essa variável — então a classe `font-sans` usava a stack
  genérica padrão do Tailwind, não a Geist. O site inteiro renderizava com a fonte do sistema em vez da
  fonte do design. Corrigido mapeando `fontFamily.sans`/`mono` pras variáveis CSS da fonte local.
- **`.env.example` nunca foi commitado**: o `.gitignore` da raiz tinha `.env.*`, um padrão amplo demais
  que também bloqueava `backend/.env.example` e `frontend/.env.example` — exatamente os arquivos que o
  "Como rodar" manda copiar. Um clone novo do repositório quebraria nos passos 2 e 6. Troquei pro padrão
  `.env` + `.env*.local` (o mesmo que o `create-next-app` já usa no `.gitignore` do frontend), que ignora
  o arquivo real de segredo mas deixa o `.example` versionado.
- **Tela "Eventos" por máquina, ligando `fetchMachineEvents`/`formatDateTime`**: até a Fase 5 essas duas
  peças existiam no código mas não eram usadas em nenhuma tela — a conversão de fuso UTC→
  America/Sao_Paulo, exigida pelo enunciado, não estava demonstrada na prática. Adicionei um botão
  "Eventos" na listagem de máquinas que abre um modal paginado com o histórico da máquina, com
  `startTime`/`endTime` formatados no fuso de exibição. Conferido contra o dado cru da API: evento com
  `startTime` `03:00 UTC` aparece como `00:00` na tela (São Paulo é UTC-3) — a conversão é real, não só
  código morto que "parece certo".
- **Dependência morta removida**: `@base-ui/react` ficou no `package.json` do frontend depois que todos
  os componentes foram reescritos pra Radix UI clássico (ver item do incidente shadcn/ui acima) — sem
  nenhum uso restante no código (confirmado por busca no projeto inteiro). Removida via `npm uninstall`.
- **`card.tsx` ficou pra trás no incidente shadcn/Tailwind v4** (mesma causa raiz do item acima), e só
  foi descoberto na Fase 6 porque os cards do dashboard estavam "comendo" o texto (letras cortadas na
  borda). Causa: a versão gerada usava sintaxe `px-(--card-spacing)`/`py-(--card-spacing)` — função de
  variável CSS que só existe no Tailwind v4; no nosso Tailwind v3 essa classe não gera CSS nenhum,
  silenciosamente. Resultado medido: `CardContent` com `padding: 24px 0px 0px` (zero nas laterais) e o
  `Card` com `overflow: hidden` — qualquer texto mais largo que o card sem padding lateral ficava
  cortado na borda. Reescrevi `card.tsx` no padrão clássico shadcn v3 (`p-6`, sem `overflow-hidden`),
  mesmo estilo dos outros componentes já corrigidos. Pra evitar que esse tipo de regressão silenciosa
  volte, também busquei (`grep -r "-(--"`) o resto do projeto por essa sintaxe — não achei mais nenhuma.
- *(demais decisões de arquitetura serão documentadas aqui conforme cada fase avança)*

## Tratamento dos dados imperfeitos

Os dados em [`data/events.json`](data/events.json) contêm, de propósito, imperfeições típicas de
telemetria de campo. A contagem abaixo vem do teste
[`clean-events.test.ts`](backend/src/data-cleaning/clean-events.test.ts) — roda `npm test` dentro de
`backend/` pra conferir.

| Imperfeição | O que caracteriza | Quantas vezes apareceu | Decisão | Por quê |
| --- | --- | --- | --- | --- |
| Evento duplicado | Mesmo `id`, payload idêntico repetido no dataset | 3 | Remover duplicatas | Preserva apenas unicidade/veracidade dos dados |
| Máquina fantasma | `machineCode` do evento não existe no cadastro de máquinas | 6 | Descarte dos eventos vinculados ao código inexistente | Máquina que não existe no cadastro não pode gerar evento válido no sistema |
| Horário invertido | `startTime` posterior ao `endTime` | 1 | Troco `startTime` e `endTime` de lugar (mantenho o evento) | Os dois valores são plausíveis e a duração resultante fica dentro do padrão dos demais eventos — o mais provável é os campos terem vindo trocados de posição, não um dado corrompido. Trocar recupera a informação sem inventar nada, já que os dois valores vieram da própria fonte** |
| Evento em aberto | `endTime: null` | 3 | Mantenho o campo `endTime` como nulo no banco, sem inventar um valor | Apesar de incompleto, ainda é um dado que pode ter sua veracidade verificada pelo usuário* |
| Eventos sobrepostos | Períodos diferentes (não cópia exata) que se cruzam para a mesma máquina | 1 cluster (7 eventos) | Remover o cluster inteiro | Mesmo quando o primeiro e o terceiro evento não se cruzam diretamente, ambos se conectam através do segundo, que sobrepõe os dois — isso torna o conjunto inteiro pouco confiável, então excluo todos, não só os que se tocam diretamente |

Obs 1 (*): No caso do `endTime: null`, a decisão depende de como o usuário utiliza o painel, pois ele pode
confirmar se aquela máquina estava mesmo funcionando ou não e assim tomar novas decisões, tendo melhor
controle. Porém, um aumento nos casos pode se tornar moroso, com o usuário tendo que ficar editando e
checando manualmente. Por isso deixo essa decisão em aberto para discussão e sigo com a decisão atual
apenas para atender este teste, devido à quantidade de dados e casos ser pequena.

Obs 2 (**): A decisão de trocar os campos no horário invertido deveria ser revisada caso o número de casos
cresça — vale investigar se realmente se trata sempre de uma simples inversão de campos, ou se em algum
momento é um dado genuinamente corrompido. Se for esse o caso, trocar os valores preservaria uma
informação errada, o que prejudicaria a veracidade de todo o conjunto — nessa situação, seria mais
confiável não ter esse dado no banco do que mantê-lo com uma correção equivocada.

## Endpoints da API

API roda em `http://localhost:3333` (`npm run dev` dentro de `backend/`).

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/machines` | Lista máquinas ativas — busca por nome/código (`?search=`), filtro por tipo (`?type=`) |
| `POST` | `/machines` | Cria máquina — validação Zod, `400` com mensagem se inválido |
| `PUT` | `/machines/:id` | Edita máquina — mesma validação |
| `DELETE` | `/machines/:id` | Soft-delete — `204`; chamar de novo no mesmo id devolve `404` |
| `GET` | `/machines/:id/events` | Eventos da máquina — filtro `?from=&to=`, paginação `?page=&limit=` |
| `GET` | `/summary` | Indicadores por máquina — `?from=&to=` opcionais (padrão: semana toda do desafio) |
| `GET` | `/summary/daily` | Horas por grupo de evento, por dia, frota inteira — alimenta o gráfico do dashboard |

## Diferenciais implementados

- **Cache em memória do `/summary`, com degradação graciosa**: o resultado calculado fica guardado por
  60 segundos, indexado pelo período pedido (`from`+`to`). Se o cache falhar por qualquer motivo, o
  código simplesmente recalcula do banco — o cache nunca é um ponto único de falha. Testado ao vivo:
  primeira chamada ~90ms (calcula tudo), chamadas seguintes no mesmo período ~3-12ms.
  - *Trade-off assumido*: como o TTL é de 60s, uma edição de máquina feita durante essa janela pode não
    aparecer imediatamente no `/summary` — aceitável pro tamanho deste teste, mas seria ajustado
    (TTL menor, ou invalidação ativa no `POST`/`PUT`/`DELETE`) numa frota de produção.

## Ideias de evolução futura

Não implementadas neste teste (fora de escopo e do tempo disponível) — registradas aqui apenas 
como o projeto poderia evoluir num cenário de produção:

- **Checagem estatística de duração por tipo de máquina**: além dos 5 casos sujos já tratados, seria
  possível monitorar a duração média dos eventos agrupada por tipo de máquina (colhedora/trator/caminhão)
  ao longo do tempo, como uma camada extra de vigilância pra detectar outliers e investigar possíveis
  inconsistências futuras nos dados — sem virar uma regra automática de exclusão (evitaria excluir um
  evento real só por ser estatisticamente incomum).
- **Normalização por área trabalhada**: se o sistema de produção tivesse o tamanho da área (hectares)
  que cada máquina trabalhou em cada evento, essa duração poderia ser normalizada (ex: horas por
  hectare), dando uma métrica mais padronizada pra julgar se a duração de um evento faz sentido. Essa
  normalização funciona bem pra **colhedora e trator**, que processam uma área de fato — mas **não se
  aplica a caminhão**, que transporta em vez de trabalhar uma área; pra esse tipo, a normalização mais
  adequada seria por distância percorrida ou carga transportada, não por hectare.
- **Limite de plausibilidade pra evento em aberto**: um evento em aberto há mais tempo que o plausível
  (ex: várias horas sem fechar) poderia ser tratado como suspeito em vez de "ainda em andamento" — não
  implementado aqui porque os 3 casos reais do dataset estão bem dentro do limite normal (31min a 2h15
  até o corte dos dados).
