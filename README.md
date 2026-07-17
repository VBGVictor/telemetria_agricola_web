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

## Diferenciais implementados

_(a preencher conforme o que sobrar de tempo)_
