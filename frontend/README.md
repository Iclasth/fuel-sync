# FuelSync Frontend

Aplicação web da plataforma **FuelSync**, desenvolvida em **React** com **Vite**, **Tailwind CSS v3**, **TanStack Query** e **Axios**, orquestrada em conjunto com o backend via **Docker** e **Docker-Compose**.

---

## 🏗️ Arquitetura e Estrutura de Diretórios

```
frontend/
├── public/                  # Assets públicos estáticos (favicons, logos)
├── src/
│   ├── assets/              # SVGs, ícones e imagens estáticas
│   ├── context/             # Gerenciamento de estado global (AuthContext)
│   ├── hooks/               # Custom hooks (useAuth)
│   ├── pages/               # Telas da aplicação
│   │   ├── auth/            # LoginPage.jsx (autenticação e RBAC)
│   │   └── HomePage.jsx     # Tela inicial autenticada
│   ├── routes/              # Configuração de rotas e ProtectedRoute
│   ├── services/            # Instância Axios e interceptores (api.js)
│   ├── test/                # Setup de testes unitários (setup.js)
│   ├── App.jsx              # Configuração de Providers (React Query, Router, Auth)
│   ├── index.css            # Diretivas do Tailwind CSS v3 e estilos base
│   └── main.jsx             # Ponto de entrada do React
├── Dockerfile               # Imagem de desenvolvimento do container frontend
├── tailwind.config.js       # Configuração do Tailwind CSS v3
├── vite.config.js           # Configuração do Vite, Proxy e Hot Reload
└── package.json
```

---

## 🔄 Comunicação Browser vs. Container e Proxy Reverso

Durante o desenvolvimento, o frontend utiliza o proxy interno do Vite (`vite.config.js`) para evitar problemas de CORS e manter chamadas relativas em `/api/v1`:

- **No Navegador (Host)**: O navegador faz requisições para `http://localhost:5173/api/v1/...`.
- **No Docker Compose**: O container do frontend lê a variável `VITE_BACKEND_TARGET=http://backend:3000` e redireciona `/api` para o container do backend.
- **Localmente sem Docker**: Sem a variável, o proxy redireciona para `http://localhost:3000`.

---

## 🚀 Como Executar

### 1. Com Docker Compose (Recomendado)

Na raiz do projeto (`fuel-sync`):

```bash
# Construir e iniciar os containers do backend e frontend
docker compose up --build

# Ou em segundo plano (detached)
docker compose up -d
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Documentação Swagger**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 2. Executando Localmente (Sem Docker)

**Backend** (no diretório raiz):
```bash
npm install
npm run dev
```

**Frontend** (no diretório `frontend`):
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testes Automatizados

Para executar os testes unitários do frontend:

```bash
# A partir do diretório frontend
npm test

# Ou a partir da raiz do projeto
npm run test:frontend

# Para rodar toda a suíte (Backend + Frontend)
npm run test:all
```
