# Modulo de Autenticacao e Controle de Acesso (Auth & RBAC)

Este modulo gerencia a identidade, autenticacao, renovacao de sessao (Silent Refresh) e controle de acesso baseado em papeis (Role-Based Access Control - RBAC) da plataforma FuelSync.

---

## 1. Visao Geral
- Integracao nativa com o Supabase Auth para gerenciamento de credenciais e emissao de tokens JWT.
- Separacao dos usuarios da plataforma em 4 perfis bem delineados (`cliente`, `posto_admin`, `entregador`, `admin_geral`).
- Middlewares reutilizaveis para autenticacao (`authMiddleware`) e autorizacao de papeis (`roleMiddleware`).
- Endpoint dedicado para renovacao silenciosa de tokens expirados (`POST /api/v1/auth/refresh`).

---

## 2. Papeis de Usuario (RBAC)

| Papel | Descricao | Escopo de Permissoes |
| :--- | :--- | :--- |
| `cliente` | Consumidor civil (Pessoa Fisica) | Cadastro publico, login, consulta de perfil proprio, criacao e rastreamento de pedidos de combustivel. |
| `posto_admin` | Administrador / Operador do Posto | Gestao de precos e combustiveis, credenciamento de entregadores e despacho da fila de entregas do seu posto. |
| `entregador` | Condutor de veiculo homologado | Consulta da fila de entregas atribuida e atualizacao de telemetria / coordenadas. |
| `admin_geral` | Administrador Master da Plataforma | Cadastro de postos homologados, delegacao de administradores a postos e acesso global a todos os recursos. |

---

## 3. Regras de Negocio

1. **Cadastro Publico de Clientes Civis**:
   - O endpoint `/api/v1/auth/signup/customer` permite que novos consumidores se cadastrem fornecendo `name`, `email`, `password`, `cpf` e `phone`.
   - O papel atribuido automaticamente e `cliente`.
   - CPF duplicado ou e-mail ja registrado retorna `HTTP 409 Conflict`.
   - Persiste dados de perfil na tabela `clientes` com vinculo a `usuario_id`.

2. **Politicas de Senha**:
   - A senha deve conter no minimo 6 caracteres.

3. **Credenciamento Restrito de Entregadores**:
   - O endpoint `/api/v1/auth/admin/create-courier` so pode ser executado por usuarios com perfil `posto_admin` ou `admin_geral`.

4. **Sessoes, Tokens e Silent Refresh**:
   - O login bem-sucedido retorna `accessToken` (JWT), `refreshToken` e os dados consolidados do usuario com seu `role`.
   - Quando o `accessToken` expira, o cliente invoca `POST /api/v1/auth/refresh` enviando `{ refreshToken }`.
   - O endpoint valida o refresh token com o Supabase Auth e devolve novo par de chaves sem deslogar o usuario.

---

## 4. Endpoints Disponiveis

| Metodo | Rota | Nivel de Acesso | Descricao |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup/customer` | Publico | Registro de consumidor civil com atribuicao de role `cliente` |
| `POST` | `/api/v1/auth/login` | Publico | Autenticacao por e-mail e senha com retorno de tokens e `role` |
| `POST` | `/api/v1/auth/refresh` | Publico | Renovacao de token JWT via refresh token valido |
| `GET` | `/api/v1/auth/me` | Autenticado | Retorna o perfil do usuario logado baseado no Bearer JWT |
| `POST` | `/api/v1/auth/admin/create-courier` | `posto_admin`, `admin_geral` | Cadastra um entregador e veiculo vinculado ao posto |
