# Critérios de Avaliação

Transparência total: é assim que o seu teste será avaliado. Pesos somam 100.

## Funcional (30 pts)

| Item | Pts |
| --- | --- |
| Seed importa os dados e o CRUD de máquinas funciona (com soft-delete) | 10 |
| `/summary` calcula os indicadores corretamente no período filtrado | 10 |
| Dashboard e tela de máquinas funcionam de ponta a ponta | 10 |

## Tratamento dos dados imperfeitos (20 pts)

O diferencial de um pleno: dados reais são sujos.

| Item | Pts |
| --- | --- |
| Cada imperfeição (evento aberto, duplicado, sobreposto, máquina fantasma, horário invertido) foi detectada e tem tratamento consciente | 12 |
| As decisões estão documentadas no README com o porquê | 8 |

## Qualidade de código (25 pts)

| Item | Pts |
| --- | --- |
| Aderência às convenções do enunciado (sem classes, sem `any`, nomenclatura, UTC) | 8 |
| Organização: separação de camadas (rotas / serviços / repositórios), componentes coesos | 8 |
| Validação Zod nas duas pontas e tratamento de erros da API no frontend (loading/erro/vazio) | 9 |

## Testes (15 pts)

| Item | Pts |
| --- | --- |
| Cálculo de indicadores coberto por testes, incluindo os casos sujos | 10 |
| Testes legíveis e determinísticos (rodam com `yarn test` sem setup manual) | 5 |

## Processo e documentação (10 pts)

| Item | Pts |
| --- | --- |
| Histórico de commits pequeno e descritivo | 5 |
| README próprio: setup funciona seguindo só o que está escrito | 5 |

## O que derruba a nota

- Setup que não roda seguindo o README.
- `any` espalhado, classes, código morto, `console.log` esquecido.
- Indicadores que não batem com a conta feita na mão a partir dos valores exibidos.
- Frontend sem tratamento de erro (tela branca quando a API está fora).

## Sobre uso de IA

Pode usar (nós usamos). Mas você precisa **defender cada linha** na entrevista de
review: vamos pedir para explicar decisões, alterar comportamentos ao vivo e
justificar trade-offs. Código que você não entende joga contra você.
