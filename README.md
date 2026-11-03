# NAVROTAS (FuelSync)

Plataforma inteligente de logística e distribuição de combustíveis sob demanda para operações marítimas e terrestres (marinas, piers, propriedades rurais e indústrias). O sistema integra gestão multi-tenant de postos de abastecimento, catálogo customizado de preços, alocação de frota de entregadores, regras rígidas de segurança contra fraudes e um motor cognitivo de previsão de entrega (ETA) alimentado por IA e telemetria operacional.

---

## Índice

- [Visão Geral e Arquitetura](#visão-geral-e-arquitetura)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
- [Instruções de Inicialização Local (Sem Docker)](#instruções-de-inicialização-local-sem-docker)
- [Deploy Separado / Produção](#deploy-separado--produção)
  - [Deploy do Back-End](#deploy-do-back-end)
  - [Deploy do Front-End](#deploy-do-front-end)
- [Execução Opcional com Docker Compose](#execução-opcional-com-docker-compose)
- [Banco de Dados e Migrações](#banco-de-dados-e-migrações)
- [Testes Automatizados](#testes-automatizados)
- [Documentação da API (Swagger / OpenAPI)](#documentação-da-api-swagger--openapi)

---

## Visão Geral e Arquitetura

O NAVROTAS resolve os gargalos de abastecimento em pontos remotos ou atracadouros náuticos, conectando clientes solicitantes diretamente a postos abastecedores autorizados e frotas de entregadores capacitados.

A arquitetura do projeto é dividida em duas aplicações totalmente autônomas e desacopladas:

1. **Back-End API (`backend/`)**:
   - Monolítico modular em Node.js (Express 5).
   - Controle de acesso baseado em funções (RBAC) com sincronização nativa na tabela `perfis_usuarios`.
   - Camadas de serviços dedicadas por domínio: Autenticação, Clientes, Postos, Catálogo e Precificação, Pedidos, Entregadores e Motor Cognitivo de IA (Groq Cloud LPU).
   - Totalmente independente, com seu próprio `package.json`, testes Jest, migrações e `Dockerfile`.

2. **Front-End SPA (`frontend/`)**:
   - Single Page Application em React 19 & Vite 8.
   - Painéis com design system limpo e responsivo em Tailwind CSS e ícones Lucide.
   - Interfaces isoladas por perfil: Área do Cliente (pedidos e rastreamento), Gestão do Posto (catálogo, pedidos da base e despacho) e Painel Administrativo.
   - Suporte dinâmico para deploy isolado via variável `VITE_API_URL` ou proxy reverso local.

3. **Persistência de Dados e RLS (Supabase / PostgreSQL)**:
   - PostgreSQL relacional gerenciado via Supabase com Row Level Security (RLS) e integridade referencial.

4. **Motor Cognitivo de Predição e Telemetria (Groq Cloud LPU)**:
   - Predição de tempo estimado de entrega (ETA) utilizando o modelo `openai/gpt-oss-120b` via Groq Cloud.
   - Fallback determinístico instantâneo para contingência em caso de oscilação de rede ou timeout.

---

## Funcionalidades Principais

- **Autenticação e RBAC**: Registro e login com papéis diferenciados (`cliente`, `posto_admin`, `entregador`, `admin`).
- **Gestão de Endereços de Entrega**: Cadastro e seleção de pontos geográficos (marinas, piers, atracadouros) com coordenadas de alta precisão (`latitude`/`longitude`).
- **Catálogo e Precificação Multi-Tenant**: Cada posto possui autonomia sobre quais combustíveis distribui e precificação customizada.
- **Ciclo Completo do Pedido**:
  - `PENDENTE`: Aguarda análise e aceite pelo posto responsável.
  - `CONFIRMADO_POSTO`: Posto aceita o pedido, calculando e fixando o baseline oficial de entrega no banco de dados.
  - `EM_PREPARACAO`: Carga em envase/preparação na base; monitoramento de atrasos em tempo real.
  - `EM_TRANSPORTE`: Carga despachada com entregador obrigatório associado e rastreamento de trajeto.
  - `CONCLUIDO`: Entrega confirmada com telemetria validada e baixa de disponibilidade do operador.
  - `CANCELADO`: Cancelamento seguro permitido apenas enquanto o pedido estiver em fase inicial (`PENDENTE`).
- **Rastreamento Neutro**: Card de telemetria transparente para o cliente ("ESTIMATIVA DE ENTREGA"), indicando previsões de horário, duração formatada e alertas operacionais.

---

## Tecnologias Utilizadas

### Back-End (`backend/`)
- **Runtime**: Node.js 20+ / 22+
- **Framework Web**: Express 5
- **Banco de Dados**: PostgreSQL através do cliente Supabase (`@supabase/supabase-js`)
- **Motor de IA**: Groq Cloud API (`openai/gpt-oss-120b`) via fetch nativo
- **Documentação**: Swagger UI Express e Swagger JSDoc (OpenAPI 3.0)
- **Testes**: Jest e Supertest

### Front-End (`frontend/`)
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Estilização**: Tailwind CSS
- **Navegação**: React Router DOM 7
- **Comunicação HTTP**: Axios com Silent Refresh automático
- **Gerenciamento de Estado de Dados**: TanStack Query (React Query)
- **Ícones**: Lucide React
- **Testes**: Vitest, React Testing Library e JSDOM

---

## Estrutura de Pastas

```plaintext
fuel-sync/
├── backend/                      # Aplicação Back-End independente
│   ├── database/                 # Migrações SQL e scripts de seed
│   │   ├── migrations/           # 001 a 008 DDLs
│   │   └── seeds/
│   ├── scripts/                  # Scripts operacionais (ex: runMigrations.js)
│   ├── src/                      # Código-fonte da API Express
│   │   ├── common/               # Middlewares, erros, utilitários e entidades de domínio
│   │   ├── config/               # Swagger e cliente Supabase
│   │   └── modules/              # Módulos: auth, catalog, couriers, customers, orders, stations, users, ai
│   ├── tests/                    # Suíte de testes unitários e de integração (Jest)
│   ├── Dockerfile                # Dockerfile para deploy do backend isolado
│   ├── package.json              # Dependências e scripts do backend
│   └── server.js                 # Ponto de entrada HTTP do servidor
├── frontend/                     # Aplicação Front-End independente (SPA)
│   ├── src/
│   │   ├── components/           # Componentes visuais e layout
│   │   ├── context/              # Contextos de autenticação e sessão
│   │   ├── pages/                # Telas (Cliente, Posto, Entregador, Admin)
│   │   ├── routes/               # Rotas e guardiões de acesso
│   │   └── services/             # Axios configurado com suporte a VITE_API_URL
│   ├── Dockerfile                # Dockerfile para build do frontend (Nginx ou dev)
│   ├── nginx.conf                # Configuração do Nginx para produção
│   ├── package.json              # Dependências e scripts do frontend
│   └── vite.config.js            # Configuração do Vite e proxy de dev
├── docker-compose.yml            # Orquestração local opcional de ambos os serviços
├── package.json                  # Scripts de conveniência da raiz do repositório
└── README.md                     # Documentação oficial
```

---

## Configuração de Variáveis de Ambiente

### Back-End (`backend/.env`)
Crie o arquivo `backend/.env` com base no `backend/.env.example`:

```env
PORT=3000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-ou-service-role
GROQ_API_KEY=gsk_sua_chave_groq_aqui
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TIMEOUT_MS=7000
DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres
```

### Front-End (`frontend/.env`)
Crie o arquivo `frontend/.env` com base no `frontend/.env.example`:

```env
# Em desenvolvimento local (porta padrão do backend):
VITE_API_URL=http://localhost:3000
VITE_BACKEND_TARGET=http://localhost:3000

# Em produção separada (ex: Vercel, Netlify):
# VITE_API_URL=https://api.seubackend.com
```

---

## Instruções de Inicialização Local (Sem Docker)

As duas aplicações rodam de forma 100% nativa via Node.js sem necessidade de Docker Compose.

### 1. Iniciar o Back-End
Em um terminal:
```bash
cd backend
npm install
npm run dev
```
O servidor estará acessível em `http://localhost:3000` (Swagger em `http://localhost:3000/api-docs`).

### 2. Iniciar o Front-End
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
A interface estará acessível em `http://localhost:5173`. O Vite fará o encaminhamento automático das requisições para `http://localhost:3000`.

### Atalhos a partir da raiz
Você também pode iniciar os serviços a partir da raiz do repositório utilizando os scripts de conveniência:
```bash
npm run dev:backend    # Roda o backend em modo watch
npm run dev:frontend   # Roda o servidor de desenvolvimento do frontend
```

---

## Deploy Separado / Produção

As duas aplicações agora possuem ciclo de vida, build e deploy totalmente independentes:

### Deploy do Back-End
Pode ser implantado em serviços como **Render, Railway, Fly.io, AWS ECS / App Runner ou Google Cloud Run**:
- **Opção A (Node.js nativo)**:
  - Diretório raiz do deploy (Root Directory): `backend`
  - Comando de Build: `npm install --omit=dev`
  - Comando de Inicialização: `npm start`
  - Variáveis de ambiente: definir as chaves de `backend/.env.example`.
- **Opção B (Container Docker)**:
  - Contexto de build: `backend/`
  - Dockerfile: `backend/Dockerfile`

### Deploy do Front-End
Pode ser implantado em plataformas estáticas/JAMstack como **Vercel, Netlify, Cloudflare Pages ou AWS S3 + CloudFront**:
- Diretório raiz do deploy (Root Directory): `frontend`
- Comando de Build: `npm run build`
- Diretório de saída do build: `dist`
- **Variável de Ambiente Obrigatória no Deploy**:
  - `VITE_API_URL=https://url-do-seu-backend-em-producao.com`

---

## Execução Opcional com Docker Compose

Caso deseje subir ambos os serviços juntos em contêineres locais com um único comando:

```bash
docker compose up -d --build
```

- **Front-End**: [http://localhost:5173](http://localhost:5173)
- **Back-End API**: [http://localhost:3000](http://localhost:3000)
- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Para parar os contêineres:
```bash
docker compose down
```

---

## Banco de Dados e Migrações

As migrações DDL estão localizadas em `backend/database/migrations/`:

- **Opção A (Via runner integrado no backend)**:
  Com `DATABASE_URL` preenchida no `.env` do backend:
  ```bash
  cd backend
  npm run migrate
  ```
- **Opção B (Via SQL Editor do Supabase)**:
  Execute os arquivos `001` a `008` sequencialmente no editor do painel web do Supabase.

---

## Testes Automatizados

Todas as suítes de teste de unidade e integração funcionam de forma autônoma:

### Testes do Back-End (Jest)
```bash
# A partir da pasta backend:
cd backend && npm test

# Ou a partir da raiz:
npm run test:backend
```
*Cobertura: 32 suítes e 349 testes automatizados cobrindo autenticação, regras de domínio, orçamentos, auditoria, IA Groq e validações.*

### Testes do Front-End (Vitest)
```bash
# A partir da pasta frontend:
cd frontend && npm test

# Ou a partir da raiz:
npm run test:frontend
```
*Cobertura: 22 arquivos e 114 testes cobrindo páginas, componentes, formulários, interceptors e guardiões de rotas.*

### Executar todos os testes
```bash
npm test
```
*Executa consecutivamente as suítes de backend e frontend.*

---

## Documentação da API (Swagger / OpenAPI)

Com o backend ativo, acesse a documentação interativa em:
- [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
