# Módulo de Clientes (Customers Domain)

Este módulo é responsável pelo gerenciamento cadastral de clientes (consumidores civis) no ecossistema Fuel-Sync.

---

## 1. Visão Geral e Responsabilidades
- Cadastro, consulta, atualização e exclusão lógica/física de clientes.
- Garantia de conformidade cadastral com os documentos oficiais brasileiros (CPF).
- Proteção integral das operações cadastrais por meio de autenticação via token JWT.

---

## 2. Regras de Negócio
1. **Unicidade de Identificação**:
   - Não é permitido mais de um cliente cadastrado com o mesmo CPF.
   - Tentativas de cadastro com CPF já existente retornam `HTTP 409 Conflict`.
2. **Validação Rigorosa de CPF**:
   - O CPF informado passa pelo algoritmo matemático oficial de dois dígitos verificadores.
   - Sequências repetidas conhecidas (como `111.111.111-11`) são rejeitadas com `HTTP 400 Bad Request`.
   - O sistema normaliza a entrada, removendo pontuações (`.` e `-`) antes de persistir no banco.
3. **Integridade de Nomes**:
   - O campo `name` é obrigatório e deve conter no mínimo 2 caracteres válidos (espaços no início e fim são removidos via `trim()`).
4. **Atualização Parcial**:
   - O endpoint de atualização (`PUT /customers/:id`) aceita modificação de `name`, `cpf` ou ambos, mas rejeita requisições sem nenhum campo enviado.

---

## 3. Segurança e Autenticação
- **Autenticação Obrigatória**: Todas as rotas deste módulo são protegidas pelo middleware `authMiddleware`.
- **Cabeçalho Requerido**: `Authorization: Bearer <JWT>` emitido pelo Supabase Auth.
- Requisições sem token válido são rejeitadas imediatamente com `HTTP 401 Unauthorized`.

---

## 4. Endpoints Disponíveis

| Método | Rota | Descrição | Status de Sucesso |
| :--- | :--- | :--- | :--- |
| `POST` | `/customers` | Cadastra um novo cliente com nome e CPF | `201 Created` |
| `GET` | `/customers` | Retorna a lista de clientes cadastrados | `200 OK` |
| `PUT` | `/customers/:id` | Atualiza os dados de um cliente existente pelo ID | `200 OK` |
| `DELETE` | `/customers/:id` | Remove o cliente do sistema pelo ID | `204 No Content` |
