# Relatório Consolidado de Achados e Triagem — NAVROTAS (FuelSync)

## 1. Resumo da Consolidação e Metodologia

A Fase 2 de Auditoria Paralela mobilizou 6 subagentes especializados atuando estritamente em modo de leitura sobre o repositório (`fuel-sync\audit-review`).

Foram coletados e deduplicados achados nas dimensões de **Segurança**, **Bugs e Lógica**, **Front-end (React)**, **Arquitetura e Performance**, **Infraestrutura e Migrações**, **Documentação e OpenAPI** e **Testes**.

### Totais Consolidados Pós-Deduplicação:
- **Total de Achados Únicos Identificados**: 48
- **Crítica**: 8
- **Alta**: 18
- **Média**: 15
- **Baixa**: 7

---

## 2. Triagem e Categorização para Ação

Cada achado foi classificado em uma das 3 categorias estritas:
1. **CORRIGIR AGORA**: Seguro, de escopo claro, sem quebra de contrato de banco ou comportamento público ambíguo.
2. **DECISÃO HUMANA**: Risco arquitetural alto, impacto em schema público do Supabase Cloud, ou definição de negócio que requer diretriz do responsável.
3. **ADIAR**: Baixo valor imediato ou melhoria estrutural ampla (registrado no backlog técnico).

---

## 3. Falsos Positivos e Descartados

| ID Original | Suposto Problema | Razão do Descarte / Reclassificação |
| :--- | :--- | :--- |
| `infra-04` | Duplicação de índice `idx_pedidos_posto_status` em migração 007 vs 001 | A migração 001 criou `idx_pedidos_posto` sobre `(posto_id)`. A migração 007 criou o índice composto `(posto_id, status)`. Não são idênticos; o índice composto otimiza filtros com status. Descartado como falso positivo. |
| `testes-05` / `pontas-soltas-01` (remoção total) | Proposta de deletar todos os arquivos de `src/common/entities/` | As classes de entidade documentam formalmente as entidades do domínio e possuem testes unitários de regras de validação (`validations.js`). Deletar sumariamente quebraria contratos documentais. Reclassificado como ADIAR para integração futura. |

---

## 4. Matriz de Triagem

### 4.1. CORRIGIR AGORA (Escopo Seguro e Imediato)

| ID | Tema | Severidade | Local | Resumo da Ação |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** (`seguranca-8` / `correcao-01`) | Segurança/Bugs | **Crítica** | `src/modules/orders/orderService.js:110` | Bloquear pedidos com combustível não comercializado pelo posto selecionado (impedir bypass antifraude). |
| **SEC-02** (`seguranca-3` / `testes-07`) | Segurança | **Crítica** | `src/modules/customers/customerRoutes.js:67,140` | Proteger `GET /customers` e `DELETE /customers/:id` com `roleMiddleware([UserRoles.ADMIN_GERAL])`. |
| **SEC-03** (`seguranca-5` / `correcao-03`) | Segurança | **Alta** | `src/modules/couriers/courierController.js:38` | Validar titularidade de `req.user.id` em `PATCH /api/v1/couriers/:id/location` e `/:id/status` (prevenir BOLA/IDOR). |
| **SEC-04** (`seguranca-7`) | Segurança | **Alta** | `src/modules/auth/authService.js:201` | Forçar vinculação do posto do `posto_admin` logado ao criar entregador, ignorando `posto_id` arbitrário no payload. |
| **SEC-05** (`seguranca-9`) | Segurança | **Média** | `src/modules/stations/stationRoutes.js:367` | Restringir `GET /stations/:id/admins` para que `posto_admin` só consulte administradores do seu próprio posto. |
| **SEC-06** (`seguranca-10`) | Segurança | **Média** | `src/modules/catalog/catalogRoutes.js:137` | Remover `UserRoles.POSTO_ADMIN` de `DELETE /catalog/fuels/:id`, reservando exclusão global para `ADMIN_GERAL`. |
| **SEC-07** (`seguranca-14`) | Segurança | **Baixa** | `.env.example:10` / `cpfValidator.js:15` | Ajustar `SKIP_CPF_VALIDATION=false` no `.env.example` e restringir bypass apenas para `NODE_ENV === 'test'`. |
| **BUG-01** (`correcao-02` / `arquitetura-4`) | Bugs | **Crítica** | `src/modules/customers/customerController.js:6` | Mapear `{ nome: name || nome, cpf, email, telefone }` no controller alinhando com a tabela `clientes`. |
| **BUG-02** (`correcao-04` / `arquitetura-5`) | Bugs | **Alta** | `src/modules/orders/orderService.js:154-169` | Implementar exclusão compensatória do pedido mestre caso a inserção de `itens_pedido` falhe. |
| **BUG-03** (`correcao-05`) | Bugs | **Alta** | `src/modules/orders/orderService.js:383` | Atualização atômica do cancelamento com `.eq('status', OrderStatus.PENDENTE)` para evitar race condition. |
| **BUG-04** (`correcao-08`) | Bugs | **Média** | `src/modules/ai/etaCalculator.js:189` | Tratar `baselineEta` inválido antes de `.toISOString()` para prevenir `RangeError: Invalid time value`. |
| **BUG-05** (`correcao-09`) | Bugs | **Média** | `src/modules/ai/aiController.js:15-20` | Permitir requisição de ETA apenas com `orderId` sem exigir `station`/`destination` no body. |
| **BUG-06** (`correcao-10`) | Bugs | **Média** | `src/modules/stations/stationValidator.js:87` | Corrigir validação geográfica parcial de postos para evitar geração de `NaN`. |
| **BUG-07** (`correcao-11`) | Bugs | **Média** | `src/modules/ai/fallbackGenerator.js:31` | Verificar `!isNaN(parsedDate.getTime())` para não exibir string `"Invalid Date"` ao usuário. |
| **BUG-08** (`correcao-12`) | Bugs | **Média** | `src/modules/customers/deliveryLocationsService.js:110` | Verificar `{ error }` ao desmarcar local padrão anterior em `locais_entrega_cliente`. |
| **FE-01** (`frontend-01`) | Front-end | **Crítica** | `frontend/src/pages/PerfilPage.jsx:46-58` | Remover `try/catch` silencioso que exibia mensagem de sucesso mesmo com erro 4xx/5xx da API. |
| **FE-02** (`frontend-02`) | Front-end | **Alta** | `frontend/src/pages/PerfilPage.jsx:47` | Adicionar guard clause defensiva contra `user` nulo ao atualizar cadastro. |
| **FE-03** (`frontend-04`) | Front-end | **Alta** | `frontend/src/pages/ComprarCombustivelPage.jsx:89` | Cancelar promessas defasadas com flag `active` e remover mock fixo de preços (`5.89`) no catch. |
| **FE-04** (`frontend-05`) | Front-end | **Média** | `frontend/src/pages/ComprarCombustivelPage.jsx:184` | Substituir `Number(coord) || fallback` por checagem explícita de `isNaN()` para não anular coordenada `0`. |
| **FE-05** (`frontend-06`) | Front-end | **Média** | `frontend/src/pages/EnderecosPage.jsx:65` | Manter inputs controlados de latitude/longitude como string durante a digitação e converter no submit. |
| **FE-06** (`frontend-07`) | Front-end | **Média** | `frontend/src/pages/EnderecosPage.jsx:69` | Adicionar estado `isSubmitting` e desabilitar botão de salvar endereço para evitar duplicidades. |
| **FE-07** (`frontend-09`) | Front-end | **Baixa** | `frontend/src/pages/posto/PostoCatalogoPage.jsx:28` | Alterar `isSaving` para `savingFuelId` desabilitando apenas o combustível que está sendo salvo. |
| **FE-08** (`frontend-12`) | Front-end | **Média** | `frontend/src/context/AuthProvider.jsx:129` | Envolver o objeto de valor do `AuthContext.Provider` em `useMemo`. |
| **INFRA-01** (`infra-01`) | Infra | **Crítica** | `scripts/runMigrations.js:25-39` | Abortar com exit code 1 quando `DATABASE_URL` não estiver configurada no runner de migrações. |
| **INFRA-02** (`infra-02`) | Infra | **Alta** | `Dockerfile:1-6` | Adicionar `apk add --no-cache postgresql-client` para viabilizar migrações no container. |
| **INFRA-03** (`infra-10` / `doc-15`) | Infra/Docs | **Alta** | `docker-compose.yml:14-17` / `.env.example` | Repassar variáveis de IA (`GROQ_*`, `DATABASE_URL`, `ROUTING_TORTUOSITY_FACTOR`) no compose e `.env.example`. |
| **DOC-01** (`doc-01`) | Documentação | **Alta** | `.env.example:1-9` | Incluir `DATABASE_URL` comentada no `.env.example`. |
| **DOC-02** (`doc-02`) | Documentação | **Alta** | `README.md:130-149` | Corrigir instruções do SQL Editor para incluir a migração `008`. |
| **DOC-03** (`doc-03`) | Documentação | **Média** | `src/modules/ai/aiRoutes.js:8` | Documentar o endpoint `POST /api/v1/ai/predict-eta` com anotações `@openapi`. |
| **DOC-04** (`doc-04`) | Documentação | **Média** | `README.md:246-254` | Incluir o módulo `/api/v1/users` no índice da API no `README.md`. |
| **DOC-05** (`doc-05`) | Documentação | **Média** | `src/modules/customers/customerRoutes.js:11` | Padronizar prefixo `/api/v1/customers` nas anotações OpenAPI de clientes. |
| **DOC-06** (`doc-07`) | Documentação | **Alta** | `src/modules/orders/orderRoutes.js:145` | Documentar propriedade `entregador_id` no schema OpenAPI de `PATCH /orders/:id/status`. |
| **DOC-07** (`doc-13`) | Documentação | **Alta** | `database/README.md:28` | Atualizar dicionário de dados incluindo as tabelas das migrações 002 e 003. |
| **CLEAN-01** (`pontas-soltas-05`) | Limpeza | **Baixa** | `src/modules/customers/customerRoutes.js:142` | Mover `require('./deliveryLocationsController')` para o topo do arquivo de rotas. |

---

### 4.2. DECISÃO HUMANA (Risco Alto, Mudança de Schema ou Decisão de Negócio)

| ID | Tema | Severidade | Contexto e Risco | Recomendação do Orquestrador |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-01** (`seguranca-1` / `infra-07`) | Segurança/DB | **Crítica** | Habilitar RLS e revogar `GRANT ALL` nas tabelas `perfis_usuarios`, `clientes` e `locais_entrega_cliente`. Se o backend ou integrações utilizarem chave `anon` em produção, o acesso será bloqueado se as políticas RLS não cobrirem todas as consultas. | **Recomendação**: Criar migração `009_enable_rls_and_granular_policies.sql` com políticas RLS restritas ao `auth.uid()` e conceder acesso via chave `service_role` para o backend. Não alterar scripts históricos `001-008`. |
| **DEC-02** (`seguranca-2` / `infra-06`) | Segurança/DB | **Crítica** | Trigger `handle_new_auth_user` em `008_sync_clientes_on_auth_user.sql` aceita `role` arbitrário do usuário no signup e pode abortar o Auth em caso de CPF/email duplicado. | **Recomendação**: Adicionar migração de ajuste na trigger forçando `role = 'cliente'` por padrão no auto-registro público e tratando exceção de `unique_violation` em `clientes` sem abortar a criação do usuário. |
| **DEC-03** (`testes-03`) | Regra de Negócio | **Crítica** | Desconto e bloqueio de compras por falta de `estoque_litros` em `orderService.js`. O sistema atual permite compras ilimitadas sem abater volume do tanque do posto. | **Recomendação**: Implementar verificação `if (stationFuel.estoque_litros !== null && item.quantidade_litros > stationFuel.estoque_litros) throw 400` e dedução em transação. Validar com a equipe de produto o fluxo de estorno em caso de cancelamento. |
| **DEC-04** (`doc-08` / `doc-09`) | Autorização | **Alta** | Conflito entre README e código: `README.md` diz que `admin_geral` pode alterar status do pedido e criar postos, mas o código restringe a `posto_admin` e `entregador`. | **Recomendação**: Homologar formalmente a matriz RBAC: Administrador Geral deve ter poder de supervisão sobre criação de postos e intervenção emergencial em pedidos. |
| **DEC-05** (`infra-05`) | Integridade DB | **Alta** | Adicionar Foreign Keys explícitas para `perfis_usuarios(id)` em `posto_administradores`, `clientes` e `entregadores`. Caso existam registros órfãos na base de produção ativa, a adição da constraint `REFERENCES` falhará. | **Recomendação**: Aplicar script de saneamento/backfill de órfãos antes de emitir o `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY`. |

---

### 4.3. ADIAR (Backlog Técnico e Melhorias Futuras)

| ID | Tema | Severidade | Descrição |
| :--- | :--- | :--- | :--- |
| **BACK-01** (`testes-01`) | Testes | Alta | Criação de suíte de testes de integração com banco de dados efêmero (PostgreSQL via Testcontainers) substituindo mocks em memória do Supabase. |
| **BACK-02** (`performance-1`) | Performance | Alta | Implementação de cache em memória (LRU cache curto) para validação de JWT e papéis em `authMiddleware.js`. |
| **BACK-03** (`performance-2`) | Performance | Alta | Paginação mandatória com `limit` e `offset` em todas as rotas de listagem (`/orders`, `/customers`, `/stations`, `/couriers`). |
| **BACK-04** (`frontend-03`) | Front-end | Alta | Refatoração completa de `OrderTrackingPage.jsx` com `useSearchParams` desacoplado e `AbortController` nativo. |
| **BACK-05** (`frontend-14`) | Front-end | Baixa | Migrar chamadas imperativas de Axios com `useEffect` para `@tanstack/react-query` (`useQuery`/`useMutation`) ou desinstalar o pacote. |
| **BACK-06** (`frontend-11`) | Front-end | Baixa | Substituição de 33 ocorrências de `console.error` no front-end por serviço centralizado de telemetria/Sentry. |
| **BACK-07** (`pontas-soltas-01`) | Arquitetura | Média | Integração das classes ricas de domínio em `src/common/entities/` no fluxo dos serviços de negócio. |
| **BACK-08** (`performance-4`) | Resiliência | Média | Implementar graceful shutdown (`server.close()`) com captura de `SIGTERM`/`SIGINT` em `server.js`. |
