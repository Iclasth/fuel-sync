# Modulo de Pedidos Civis B2C (src/modules/orders)

Este modulo gerencia as solicitacoes de abastecimento fracionado para consumidores civis (embarcacoes em marinas, geradores em condominios e chacaras), com antifraude de precos por posto e maquina de estados logistica.

---

## 1. Regras de Negocio

1. **Multiplos Itens de Combustiveis (itens_pedido)**:
   - Cada pedido deve conter pelo menos uma linha de combustivel (`combustivel_id`, `quantidade_litros`, `valor_unitario`).
   - Volumes e precos unitarios devem ser numeros estritamente maiores que zero.

2. **Validacao Antifraude de Precos por Posto**:
   - No fluxo de criacao do pedido (`POST /api/v1/orders`), o servidor consulta a tabela `posto_combustiveis` para o `posto_id` informado.
   - Verifica se o combustivel esta disponivel no posto (`disponivel = true`).
   - Confere se o `valor_unitario` do payload corresponde com fidelidade ao `preco_litro` vigente no posto. Caso haja divergencia, o pedido e rejeitado com `HTTP 400 Bad Request`.
   - O calculo do subtotal de cada item e do valor total do pedido e recalculado estritamente no servidor.

3. **Localizacao e Especificidades Civis**:
   - O tipo de local (`tipo_local`) deve ser um valor suportado (`MARINA`, `CONDOMINIO`, `CHACARA`, `RODOVIA`, `RESIDENCIA`, `OUTRO`).
   - E obrigatorio o fornecimento de coordenadas geograficas (`destino_latitude`, `destino_longitude`) no intervalo terrestre valido.
   - Ponto de referencia detalhado (ex: "Marina da Gloria, Pier B, Vaga 14 - Lancha Marlin") e essencial para a localizacao precisa do abastecimento no destino.

4. **Segregacao por Perfil (RBAC)**:
   - Consumidores civis (`cliente`) so visualizam e operam seus proprios pedidos vinculados ao seu `usuario_id`.
   - Administradores do posto parceiro (`posto_admin`) gerenciam todos os pedidos atribuidos ao seu posto.
   - Administradores gerais (`admin_geral`) possuem visibilidade global.

5. **Ciclo de Estados e Maquina de Estados**:
   - Estados: `PENDENTE` -> `CONFIRMADO_POSTO` -> `EM_PREPARACAO` -> `EM_TRANSPORTE` -> `CONCLUIDO` (ou `CANCELADO`).
   - O cliente so pode cancelar o pedido se o status for `PENDENTE` atraves de `POST /api/v1/orders/:id/cancel`. Apos o inicio do preparo ou transporte, o cancelamento e bloqueado.
   - Apenas `posto_admin` e `admin_geral` podem avancar o status do pedido via `PATCH /api/v1/orders/:id/status`.

---

## 2. Endpoints Disponiveis

| Metodo | Rota | Nivel de Acesso | Descricao |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | `cliente`, `posto_admin` | Cria solicitacao de abastecimento com validacao antifraude |
| `GET` | `/api/v1/orders` | Autenticado | Lista pedidos com segregacao por papel do usuario |
| `GET` | `/api/v1/orders/:id` | Autenticado | Detalhes do pedido com linhas de itens |
| `PATCH` | `/api/v1/orders/:id/status` | `posto_admin`, `admin_geral` | Transicao de status operacional na maquina de estados |
| `POST` | `/api/v1/orders/:id/cancel` | `cliente`, `posto_admin` | Cancelamento do pedido (exclusivo para status PENDENTE) |
