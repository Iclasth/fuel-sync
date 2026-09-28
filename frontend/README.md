# FuelSync Frontend

Aplicação web da plataforma FuelSync, desenvolvida em React com Vite, Tailwind CSS v3, TanStack Query e Axios, orquestrada em conjunto com o backend via Docker e Docker Compose.

---

## Arquitetura e Estrutura de Diretórios

```
frontend/
├── public/                  # Assets públicos estáticos (favicons, logos)
├── src/
│   ├── assets/              # SVGs, ícones e imagens estáticas
│   ├── components/          # Componentes reutilizáveis
│   │   └── layout/          # AppLayout.jsx (sidebar corporativa, drawer mobile)
│   ├── context/             # Gerenciamento de estado global (AuthContext)
│   ├── hooks/               # Custom hooks (useAuth)
│   ├── pages/               # Telas da aplicação
│   │   ├── auth/            # LoginPage.jsx, RegisterPage.jsx
│   │   ├── posto/           # PostoPedidosPage.jsx, PostoCatalogoPage.jsx, PostoEntregadoresPage.jsx
│   │   ├── admin/           # AdminPostosPage.jsx, AdminVinculosPage.jsx
│   │   ├── HomePage.jsx     # Dashboard resumido do cliente
│   │   ├── PerfilPage.jsx   # Gestão cadastral do cliente
│   │   ├── ComprarCombustivelPage.jsx # Solicitação de abastecimento com precificação real
│   │   ├── OrderTrackingPage.jsx      # Telemetria e máquina de estados do pedido
│   │   └── EnderecosPage.jsx          # Pontos de entrega homologados e coordenadas
│   ├── routes/              # Configuração de rotas (AppRoutes, ProtectedRoute, RoleRoute)
│   ├── services/            # Instância Axios e interceptores de Silent Refresh (api.js)
│   ├── test/                # Setup de testes unitários (setup.js)
│   ├── App.jsx              # Configuração de Providers (QueryClient, Router, Auth)
│   ├── index.css            # Diretivas do Tailwind CSS v3 e estilos base
│   └── main.jsx             # Ponto de entrada do React
├── Dockerfile               # Imagem de desenvolvimento do container frontend
├── tailwind.config.js       # Design system institucional (Poppins, paleta corporativa)
├── vite.config.js           # Configuração do Vite, Proxy e Hot Reload
└── package.json
```

---

## Sessão Resiliente e Silent Refresh

A comunicação HTTP via `src/services/api.js` implementa um mecanismo transparente de renovação de sessão:
1. Intercepta requisições de saída anexando o token JWT (`Bearer <token>`).
2. Intercepta erros HTTP 401: caso o access token esteja expirado, aciona `POST /api/v1/auth/refresh` com o `refreshToken` persistido.
3. Enfileira requisições concorrentes (`failedQueue`) enquanto a renovação está em andamento para evitar chamadas duplicadas.
4. Ao receber novos tokens, reexecuta as requisições pendentes na fila com o novo cabeçalho.
5. Se o refresh falhar (token revogado ou inválido), encerra a sessão e redireciona ao login.

---

## Comunicação Browser vs. Container e Proxy Reverso

Durante o desenvolvimento, o frontend utiliza o proxy interno do Vite (`vite.config.js`) para evitar problemas de CORS e manter chamadas relativas em `/api/v1`:

- **No Navegador (Host)**: O navegador faz requisições para `http://localhost:5173/api/v1/...`.
- **No Docker Compose**: O container do frontend lê a variável `VITE_BACKEND_TARGET=http://backend:3000` e redireciona `/api` para o container do backend.
- **Localmente sem Docker**: Sem a variável, o proxy redireciona para `http://localhost:3000`.

---

## Como Executar

### 1. Com Docker Compose (Recomendado)

Na raiz do projeto (`fuel-sync`):

```bash
# Construir e iniciar os containers do backend e frontend
docker compose up -d

# Visualizar logs
docker compose logs -f
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Documentação Swagger: http://localhost:3000/api-docs

### 2. Executando Localmente (Sem Docker)

Backend:
```bash
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Testes Automatizados

Executar a suíte de testes unitários do frontend via Vitest:

```bash
npm --prefix frontend test
```
