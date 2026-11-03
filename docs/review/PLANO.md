# Plano de Inspeção e Auditoria Completa do Código - NAVROTAS (FuelSync)

## 1. Visão Geral e Contexto da Inspeção

O objetivo deste plano é auditar minuciosamente o projeto NAVROTAS (FuelSync), abrangendo o back-end em Node.js/Express, a persistência com Supabase/PostgreSQL, o motor cognitivo com Groq Cloud LPU e o front-end SPA em React 19/Vite.

A auditoria visa identificar e remediar:
- Bugs de lógica, tratamento de erros e edge cases;
- Vulnerabilidades de segurança (RBAC, injeção, segredos, sanitização);
- Dívidas técnicas e violações de arquitetura/design;
- Lacunas de cobertura de testes e testes frágeis;
- Gargalos de performance e I/O bloqueante;
- Pontas soltas (TODO/FIXME, dead code, imports não utilizados, logs residuais);
- Documentação desatualizada e inconsistências com o código.

---

## 2. Linha de Base (*Baseline*) Verificada (Fase 0)

- **Branch de trabalho**: `joaomiguel-csi/audit-review`
- **Estado do Git**: Limpo (*working tree clean*)
- **Dependências instaladas**: `npm ci` na raiz e em `frontend/`
- **Testes Back-end (Jest & Supertest)**:
  - 29 suítes de teste executadas, 29 aprovadas (100%).
  - 285 testes unitários e de integração aprovados.
  - 0 falhas.
- **Testes Front-end (Vitest & Testing Library)**:
  - 18 arquivos de teste executados, 18 aprovados (100%).
  - 86 testes aprovados.
  - 0 falhas.
- **Linters Front-end (oxlint)**:
  - 0 erros, 45 advertências (todas relacionadas a avisos de renderização de hooks / otimização do React Compiler).
- **Build Front-end (Vite 8)**:
  - Compilação concluída com sucesso (`dist/` gerado sem erros de sintaxe ou tipos).

---

## 3. Ferramentas, Plugins e Skills Mobilizados

### 3.1. Superpowers
- `brainstorming` / `writing-plans`: Estruturação atômica do plano e decomposição de escopos.
- `dispatching-parallel-agents` / `subagent-driven-development`: Despacho coordenado de subagentes independentes com escopos bem delimitados, sem compartilhamento de estado.
- `systematic-debugging`: Análise de causa raiz para bugs com rastreabilidade de entrada e saída.
- `test-driven-development` (TDD): Implementação estrita de teste que falha antes de qualquer correção de bug na Fase 4.
- `requesting-code-review` / `receiving-code-review`: Revisão cega por subagente de auditoria antes da consolidação de lotes.
- `verification-before-completion`: Verificação comparativa com o baseline antes de declarar conclusão.

### 3.2. Context-Mode
- **Política de Economia de Contexto**: Proibição de despejo de saídas brutas (>30 linhas) no chat. Todos os comandos de execução de testes, builds e varreduras são filtrados por scripts utilitários trazendo apenas o resumo e trecho exato de falhas.

### 3.3. Ponytail
- Senior pragmatism (YAGNI): Adoção da menor alteração completa que resolve o problema na raiz (`ponytail: full`).
- `ponytail-audit`: Mapeamento de bugs, riscos em carga real, ausência de testes em trechos arriscados e identificação de código desnecessário/morto (*lean*).
- `ponytail-review`: Revisão rigorosa de diffs pós-correção.

---

## 4. Divisão do Código por Áreas e Módulos

| Módulo | Escopo de Arquivos | Tecnologias Principais |
| :--- | :--- | :--- |
| **M1: Core & Auth** | `src/modules/auth/`, `src/modules/users/`, `src/common/middlewares/`, `src/common/utils/`, `src/common/errors/`, `src/config/` | Express, Supabase Auth, JWT/Bcrypt, RBAC |
| **M2: Negócio & Operação** | `src/modules/stations/`, `src/modules/catalog/`, `src/modules/couriers/`, `src/modules/customers/`, `src/modules/orders/`, `src/common/entities/` | Express, Validações de Domínio, Supabase Client |
| **M3: IA & Telemetria** | `src/modules/ai/`, `src/config/swagger.js`, `server.js`, `src/app.js` | Groq Cloud LPU, Haversine/Geo, Swagger OpenAPI |
| **M4: Front Core & Infra** | `frontend/src/context/`, `frontend/src/hooks/`, `frontend/src/routes/`, `frontend/src/services/`, `frontend/src/components/` | React 19, React Router 7, Axios, TanStack Query |
| **M5: Front Páginas & UX** | `frontend/src/pages/`, `frontend/src/pages/admin/`, `frontend/src/pages/posto/`, `frontend/src/pages/auth/` | React 19, Tailwind CSS, Lucide React |
| **M6: Banco, Scripts & CI** | `database/migrations/`, `database/seeds/`, `scripts/`, `Dockerfile`, `docker-compose.yml`, `package.json` | PostgreSQL, SQL Scripts, Docker, Node CLI |

---

## 5. Dimensões de Auditoria

1. **Correção e Bugs**: Lógica, fluxos condicionais, conversão de tipos, tratamento de erros assíncronos (`try/catch`), edge cases numéricos/datas, race conditions e ponteiros nulos/indefinidos.
2. **Segurança**: Vulnerabilidades BOLA/IDOR, autorização em endpoints sensíveis, validação estrita de inputs, injeção de SQL ou payloads maliciosos, exposição de segredos/chaves de API, configuração de CORS e cabeçalhos.
3. **Arquitetura e Design**: Acoplamento entre módulos, vazamento de abstração, duplicação desnecessária (DRY com pragmatismo), separação entre camadas de apresentação, serviço e acesso a dados.
4. **Testes**: Qualidade das asserções, cobertura de caminhos críticos (pedidos, precificação, autenticação), testes excessivamente acoplados a mocks que mascaram quebras reais.
5. **Performance**: I/O bloqueante no loop de eventos do Node.js, consultas sem filtro ou sem paginação, loops síncronos desnecessários, re-renderizações descontroladas no React.
6. **Dependências e Build**: Pacotes sem uso, scripts inconsistentes, empacotamento do Docker, alertas de segurança em dependências.
7. **Pontas Soltas**: Comentários `TODO`, `FIXME`, `HACK`, dead code, exports não consumidos, logs residuais de debug (`console.log`), parâmetros esquecidos.
8. **Documentação**: Contradições entre README, especificações de endpoints no Swagger, schemas SQL documentados e implementação real; variáveis de ambiente no `.env.example`.

---

## 6. Alocação de Subagentes Especializados em Paralelo (Fase 2)

| Subagente | Especialidade | Escopo Designado | Dimensões Foco |
| :--- | :--- | :--- | :--- |
| **Agente 1: `appsec-code-audit`** | Segurança e Defesa | Repositório Completo (Back-end, Front-end, DB, Docker, .env) | Segurança, RBAC, BOLA/IDOR, Segredos, Sanitização |
| **Agente 2: `core-implementer`** | Engenharia de Domínio Back-end | Módulos M1 e M2 (`src/modules/`, `src/common/`) | Correção e Bugs, Lógica de Negócio, Edge Cases, Validações |
| **Agente 3: `code-reviewer`** | Arquitetura & Qualidade | Módulos M1, M2 e M3 (`src/`, `server.js`, `app.js`) | Arquitetura, Design, Pontas Soltas, Performance, YAGNI |
| **Agente 4: `ui-api-implementer`** | Front-end & Integração | Módulos M4 e M5 (`frontend/src/`) | Bugs no Front, Ciclo de Vida React, Pontas Soltas, UX/Tratamento de Erro |
| **Agente 5: `validator`** | QA, Testes & Infraestrutura | Módulo M6 (`tests/`, `database/`, `scripts/`, Docker, packages) | Testes, Cobertura, Dependências, Integridade de Schemas |
| **Agente 6: `docs-adr-writer`** | Documentação & OpenAPI | Documentação global (`README.md`, `swagger.js`, `.env.example`, `database/README.md`) | Documentação vs Código, Contratos de API, Setup |

---

## 7. Formato Obrigatório de Saída por Achado (Auditores Read-Only)

Cada achado reportado pelos subagentes deve respeitar estritamente o modelo:

- **ID**: `<dimensão>-<nº>`
- **Severidade**: crítica | alta | média | baixa
- **Confiança**: alta | média | baixa
- **Local**: `arquivo:linha`
- **Problema**: `<1-2 frases>`
- **Evidência**: `<trecho mínimo ou comando que comprova>`
- **Correção sugerida**: `<1-3 frases>`
- **Risco da correção**: baixo | médio | alto
- **Não Coberto**: `<itens que não puderam ser validados>`

---

## 8. Critérios de Pronto (*Definition of Done*) e Riscos Conhecidos

### 8.1. Critérios de Pronto
1. Nenhum achado classificado como crítico ou alto sem correção aprovada ou decisão humana devidamente documentada.
2. 100% dos testes da baseline aprovados (mínimo de 285 testes no back-end e 86 no front-end, sem regressões).
3. Novos testes adicionados para cobrir cada bug corrigido (TDD).
4. Build de produção do front-end (`npm run build:frontend`) executado com sucesso e linters sem novos erros.
5. Todos os achados consolidados em `docs/review/ACHADOS.md` com rastreabilidade completa.
6. Relatório final entregue em `docs/review/RELATORIO.md`.

### 8.2. Riscos Conhecidos e Salvaguardas
- **Alterações de Schema de Banco**: Mudanças estruturais em tabelas do Supabase devem ser registradas como migrations idempotentes e sinalizadas para DECISÃO HUMANA caso impliquem risco de perda de dados.
- **Contratos de API Públicos**: Não alterar payloads esperados por clientes sem versionamento ou decisão humana.
- **Ambiente de Testes sem Instância Ativa de Banco**: Os testes unitários e de integração existentes utilizam mocks do Supabase Client e Groq Client; as correções devem manter a integridade dos testes em modo offline/mockado e respeitar a compatibilidade com o PostgreSQL real.
