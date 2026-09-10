# Módulo de Autenticação e Controle de Acesso (Auth & RBAC)

Este módulo gerencia a identidade, autenticação e controle de acesso baseado em papéis (Role-Based Access Control - RBAC) da plataforma Fuel-Sync.

---

## 1. Visão Geral
- Integração nativa com o **Supabase Auth** para gerenciamento de credenciais e emissão de tokens JWT.
- Separação dos usuários da plataforma em 3 perfis bem delineados (`cliente`, `posto_admin`, `entregador`).
- Middlewares reutilizáveis para autenticação (`authMiddleware`) e autorização de papéis (`roleMiddleware`).

---

## 2. Papéis de Usuário (RBAC)

| Papel | Descrição | Escopo de Permissões |
| :--- | :--- | :--- |
| **`cliente`** | Consumidor civil (Pessoa Física) | Cadastro público, login, consulta de perfil próprio, criação e rastreamento de pedidos de combustível. |
| **`posto_admin`** | Administrador / Operador do Posto | Gestão de preços e combustíveis, credenciamento de entregadores e despacho da fila de entregas. |
| **`entregador`** | Condutor de veículo homologado | Consulta da fila de entregas atribuída e avanço das etapas do ciclo logístico. |

---

## 3. Regras de Negócio
1. **Cadastro Público de Clientes Civis**:
   - O endpoint `/api/v1/auth/signup/customer` permite que novos consumidores se cadastrem fornecendo `name`, `email`, `password`, `cpf` e `phone`.
   - O papel atribuído automaticamente é `cliente`.
   - CPF duplicado ou e-mail já registrado retorna `HTTP 409 Conflict`.
2. **Políticas de Senha**:
   - A senha deve conter no mínimo 6 caracteres.
3. **Credenciamento Restrito de Entregadores**:
   - O endpoint `/api/v1/auth/admin/create-courier` só pode ser executado por usuários com perfil `posto_admin`.
   - Tentativa de chamada por um usuário com perfil `cliente` resulta em `HTTP 403 Forbidden`.
4. **Sessões e Tokens**:
   - O login bem-sucedido retorna `accessToken` (JWT), `refreshToken` e os dados consolidados do usuário com seu `role`.
   - O endpoint `/api/v1/auth/me` decodifica o token Bearer e retorna os dados do perfil ativo.

---

## 4. Endpoints Disponíveis

| Método | Rota | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup/customer` | **Público** | Registro de consumidor civil com atribuição de role `cliente` |
| `POST` | `/api/v1/auth/login` | **Público** | Autenticação por e-mail e senha com retorno de tokens e `role` |
| `GET` | `/api/v1/auth/me` | **Autenticado** | Retorna o perfil do usuário logado baseado no Bearer JWT |
| `POST` | `/api/v1/auth/admin/create-courier` | **`posto_admin`** | Cadastra um entregador e veículo vinculado ao posto |
