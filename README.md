# NAVROTAS (FuelSync)

Plataforma inteligente de logística e distribuição de combustíveis sob demanda para operações marítimas e terrestres (marinas, piers, propriedades rurais e indústrias). O sistema integra gestão multi-tenant de postos de abastecimento, catálogo customizado de preços, alocação de frota de entregadores, regras rígidas de segurança contra fraudes e um motor cognitivo de previsão de entrega (ETA) alimentado por IA e telemetria operacional.

---

## Índice

- [Visão Geral e Arquitetura](#visão-geral-e-arquitetura)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
- [Estrutura do Banco de Dados e Migrações](#estrutura-do-banco-de-dados-e-migrações)
- [Instruções de Inicialização](#instruções-de-inicialização)
  - [Opção 1: Execução com Docker Compose (Recomendado)](#opção-1-execução-com-docker-compose-recomendado)
  - [Opção 2: Execução Manual para Desenvolvimento Local](#opção-2-execução-manual-para-desenvolvimento-local)
- [Testes Automatizados](#testes-automatizados)
- [Documentação da API (Swagger / OpenAPI)](#documentação-da-api-swagger--openapi)
- [Estrutura de Pastas do Projeto](#estrutura-de-pastas-do-projeto)

---

## Visão Geral e Arquitetura

O NAVROTAS resolve os gargalos de abastecimento em pontos remotos ou atracadouros náuticos, conectando clientes solicitantes diretamente a postos abastecedores autorizados e frotas de entregadores capacitados.

A arquitetura do projeto é dividida em:

1. **Back-End Monolítico Modular (Node.js & Express)**:
   - Controle de acesso baseado em funções (RBAC) com sincronização nativa na tabela `perfis_usuarios`.
   - Camadas de serviços dedicadas por domínio: Autenticação, Clientes, Postos, Catálogo e Precificação, Pedidos, Entregadores e Motor Cognitivo de IA.
2. **Front-End Single Page Application (React 19 & Vite)**:
   - Painéis com design system limpo e responsivo em Tailwind CSS, expansão widescreen (`w-full`) e ícones Lucide.
   - Interfaces isoladas por perfil: Área do Cliente (pedidos e rastreamento), Gestão do Posto (catálogo, pedidos da base e equipe de despacho) e Painel Administrativo.
3. **Persistência de Dados e RLS (Supabase / PostgreSQL)**:
   - PostgreSQL relacional gerenciado via Supabase com Row Level Security (RLS) e integridade referencial.
4. **Motor Cognitivo de Predição e Telemetria (Groq Cloud LPU)**:
   - Predição de tempo estimado de entrega (ETA) utilizando o modelo `openai/gpt-oss-120b` via Groq Cloud de altíssima velocidade.
   - Fallback determinístico instantâneo para contingência em caso de oscilação de rede ou timeout.
   - Saneamento geodésico (Haversine + fator de tortuosidade) e fixação de baseline de entrega com alertas de desvio operacional.

---

## Funcionalidades Principais

- **Autenticação e RBAC**: Registro e login com papéis diferenciados (`cliente`, `posto_admin`, `entregador`, `admin`).
- **Gestão de Endereços de Entrega**: Cadastro e seleção de pontos geográficos (marinas, piers, atracadouros) com coordenadas de alta precisão (`latitude`/`longitude`).
- **Catálogo e Precificação Multi-Tenant**: Cada posto possui autonomia sobre quais combustíveis distribui, permitindo definir margens de lucro ou preços unitários específicos por base.
- **Ciclo Completo do Pedido**:
  - `PENDENTE`: Aguarda análise e aceite pelo posto responsável, exibindo fila de espera isolada.
  - `CONFIRMADO_POSTO`: Posto aceita o pedido, calculando e fixando o baseline oficial de entrega no banco de dados.
  - `EM_PREPARACAO`: Carga em envase/preparação na base; atrasos em relação ao baseline são monitorados em tempo real.
  - `EM_TRANSPORTE`: Carga despachada com entregador obrigatório associado e rastreamento de trajeto.
  - `CONCLUIDO`: Entrega confirmada com telemetria validada e baixa de disponibilidade do operador.
  - `CANCELADO`: Cancelamento seguro permitido apenas enquanto o pedido estiver em fase inicial (`PENDENTE`), prevenindo fraudes operacionais após o início do despacho.
- **Rastreamento Neutro**: Card de telemetria transparente para o cliente ("ESTIMATIVA DE ENTREGA"), indicando previsões de horário, duração formatada em horas e minutos e eventuais alertas operacionais.

---

## Tecnologias Utilizadas

### Back-End
- **Runtime**: Node.js 20+
- **Framework Web**: Express 5
- **Banco de Dados**: PostgreSQL através do cliente Supabase (`@supabase/supabase-js`)
- **Motor de IA**: Groq Cloud API (`openai/gpt-oss-120b`) via fetch nativo
- **Documentação**: Swagger UI Express e Swagger JSDoc (OpenAPI 3.0)
- **Testes**: Jest e Supertest

### Front-End
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Estilização**: Tailwind CSS
- **Navegação**: React Router DOM 7
- **Comunicação HTTP**: Axios
- **Gerenciamento de Estado de Dados**: TanStack Query (React Query)
- **Ícones**: Lucide React
- **Testes**: Vitest, React Testing Library e JSDOM

### Infraestrutura e DevOps
- **Conteinerização**: Docker e Docker Compose
- **Orquestração de Rede**: Bridge Network dedicada (`fuel-sync-network`)

---

## Pré-requisitos

Antes de iniciar, certifique-se de possuir instalado em seu ambiente:

- **Node.js**: Versão 20.x ou superior
- **npm**: Versão 10.x ou superior
- **Docker e Docker Compose** (caso opte pela execução conteinerizada)
- **Instância do Supabase** (projeto ativo no Supabase ou PostgreSQL local compatível)
- **Chave de API da Groq Cloud** (obtida gratuitamente em [console.groq.com](https://console.groq.com))

---

## Configuração de Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto a partir do modelo existente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` preenchendo as seguintes chaves:

```env
# Porta do servidor back-end
PORT=3000

# Conexão com o Supabase (obrigatório)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-ou-service-role

# Configurações do Motor de IA Groq Cloud
GROQ_API_KEY=gsk_sua_chave_groq_aqui
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TIMEOUT_MS=2500

# Opcional: String de conexão direta para execução automatizada de migrações DDL
DATABASE_URL=postgresql://postgres:sua_senha@db.seu-projeto.supabase.co:5432/postgres
```

---

## Estrutura do Banco de Dados e Migrações

As tabelas e políticas de banco de dados estão versionadas na pasta `database/migrations/`:

1. `001_initial_b2c_schema.sql`: Tabelas fundamentais de perfis, postos, combustíveis, pedidos e entregas.
2. `002_station_pricing_and_multi_tenant.sql`: Regras de precificação independente por posto e auditoria de preços.
3. `003_client_delivery_locations.sql`: Cadastro de múltiplos endereços de entrega com suporte a geolocalização.
4. `004_sync_perfis_usuarios.sql`: Triggers de sincronização de usuários e mapeamento de perfis de acesso.
5. `005_order_courier_assignment.sql`: Suporte ao vínculo e obrigatoriedade de entregadores nos pedidos despachados.
6. `006_ai_predictions_order_support.sql`: Coluna `pedido_id` e metadados para previsões por pedido na tabela `previsoes_ia`.
7. `007_order_baseline_eta.sql`: Campos `horario_previsto_entrega`, `tempo_estimado_entrega_minutos` e índice composto por posto e status.

### Como aplicar as migrações

- **Opção A (Via runner integrado)**:
  Com a variável `DATABASE_URL` configurada no `.env`, execute:
  ```bash
  npm run migrate
  ```

- **Opção B (Via Console do Supabase)**:
  Copie o conteúdo dos scripts SQL em ordem sequencial (`001` até `007`) e execute-os diretamente no **SQL Editor** do seu painel do Supabase.

---

## Instruções de Inicialização

### Opção 1: Execução com Docker Compose (Recomendado)

O Docker Compose sobe todo o ambiente unificado (Back-End na porta `3000` e Front-End na porta `5173`), com volumes mapeados e reload automático de código.

1. Construa as imagens e inicie os contêineres em segundo plano:
   ```bash
   docker-compose up -d --build
   ```

2. Verifique os logs dos serviços:
   ```bash
   docker-compose logs -f
   ```

3. Acesse a aplicação:
   - **Front-End**: [http://localhost:5173](http://localhost:5173)
   - **Back-End API**: [http://localhost:3000](http://localhost:3000)
   - **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

4. Para parar os contêineres:
   ```bash
   docker-compose down
   ```

---

### Opção 2: Execução Manual para Desenvolvimento Local

Caso prefira rodar os serviços nativamente no seu sistema operacional:

#### 1. Back-End

Abra o primeiro terminal no diretório raiz do projeto:

```bash
# 1. Instalar as dependências do servidor
npm install

# 2. Iniciar o servidor em modo de desenvolvimento (com auto-reload)
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

#### 2. Front-End

Abra um segundo terminal no diretório raiz do projeto:

```bash
# 1. Acessar a pasta do frontend e instalar as dependências
cd frontend
npm install

# 2. Iniciar o servidor Vite de desenvolvimento
npm run dev
```

A interface web estará disponível em `http://localhost:5173`. O Vite está configurado para direcionar chamadas de API (`/api/v1`) automaticamente para `http://localhost:3000`.

---

## Testes Automatizados

O projeto mantém uma suíte robusta de testes de unidade e integração cobrindo fluxos de ponta a ponta, regras de validação de dados, integridade de esquema, autenticação, rotas de IA e componentes de interface.

### Executar testes do Back-End (Jest)
```bash
npm test
```
*Cobertura: 28 suítes e 259 testes automatizados com mocks de persistência e simulações do motor Groq LPU.*

### Executar testes do Front-End (Vitest)
```bash
npm run test:frontend
```
*Cobertura: 15 arquivos e 70 testes automatizados cobrindo páginas, formulários de compra, rotas protegidas e cards de rastreio.*

### Executar toda a suíte de testes (Full Suite)
```bash
npm run test:all
```
*Executa consecutivamente os 329 testes automatizados com validação estrita de regressões.*

---

## Documentação da API (Swagger / OpenAPI)

A documentação interativa completa de todos os endpoints RESTful está acessível via Swagger UI com o back-end em execução:

- URL: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Principais grupos de rotas documentados:
- `/api/v1/auth`: Cadastro, login, renovação silenciosa de tokens e dados do perfil autenticado.
- `/api/v1/customers`: Cadastro, consulta e gestão de dados do cliente solicitante.
- `/api/v1/stations`: Cadastro de postos, parametrização de localização e tempo médio de preparo.
- `/api/v1/catalog`: Catálogo de combustíveis disponíveis e definição de tabelas de preços por posto.
- `/api/v1/couriers`: Cadastro de condutores/embarcações, status operacional e disponibilidade de frota.
- `/api/v1/orders`: Criação de pedidos, consulta de detalhes, atualização de estados e despacho obrigatório com entregador.
- `/api/v1/ai/predict-eta`: Cálculo contextual de tempo estimado de entrega (ETA), telemetria e análise de desvios operacionais.

---

## Estrutura de Pastas do Projeto

```plaintext
fuel-sync/
├── database/
│   └── migrations/               # Scripts DDL sequenciais do banco de dados (001 a 007)
├── frontend/
│   ├── public/                   # Favicons e ativos públicos
│   └── src/
│       ├── components/           # Componentes reutilizáveis e layout da aplicação
│       ├── context/              # Contextos React (Autenticação e Sessão)
│       ├── pages/                # Telas (Cliente, Posto, Entregador, Admin)
│       ├── routes/               # Gerenciador de rotas e guardiões de acesso (RBAC)
│       └── services/             # Configuração do Axios e clientes de API
├── scripts/
│   └── runMigrations.js          # Utilitário de execução de scripts SQL
├── src/
│   ├── common/
│   │   ├── errors/               # Classes padronizadas de erros HTTP (AppError)
│   │   └── middlewares/          # Autenticação JWT, validação de perfis e error handler
│   ├── config/
│   │   └── swagger.js            # Especificações OpenAPI / Swagger JSDoc
│   └── modules/
│       ├── ai/                   # Motor cognitivo Groq LPU, cálculo de ETA e fallbacks
│       ├── auth/                 # Controladores, rotas e regras de autenticação
│       ├── catalog/              # Catálogo de produtos e precificação por posto
│       ├── couriers/             # Gestão de entregadores e frotas de distribuição
│       ├── customers/            # Endereços e dados de clientes
│       ├── orders/               # Máquina de estados de pedidos e despacho
│       └── stations/             # Gestão e telemetria de bases de abastecimento
├── tests/
│   ├── integration/              # Testes de integração de endpoints REST
│   └── unit/                     # Testes unitários de regras de negócio e validadores
├── docker-compose.yml            # Orquestração de contêineres Docker
├── Dockerfile                    # Configuração de build da imagem de Back-End
├── package.json                  # Manifesto de dependências e scripts NPM raiz
└── README.md                     # Documentação oficial do projeto
```
