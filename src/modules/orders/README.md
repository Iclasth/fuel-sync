# Módulo de Pedidos Civis B2C (`src/modules/orders`)

Este módulo gerencia as solicitações de abastecimento fracionado para consumidores civis (embarcações em marinas, geradores em condomínios e chácaras).

---

## 1. Regras de Negócio

1. **Múltiplos Itens de Combustíveis (`itens_pedido`)**:
   - Cada pedido deve conter pelo menos uma linha de combustível (`combustivel_id`, `quantidade_litros`, `valor_unitario`).
   - Volumes e preços unitários devem ser números estritamente maiores que zero.
2. **Cálculo Financeiro Confiável**:
   - O cálculo do subtotal de cada item ($\text{quantidade\_litros} \times \text{valor\_unitario}$) e do total do pedido ($\sum \text{subtotais}$) é realizado pelo servidor, evitando manipulação de valores pelo cliente.
3. **Localização e Especificidades Civis**:
   - O tipo de local (`tipo_local`) deve ser um valor suportado (`MARINA`, `CONDOMINIO`, `CHACARA`, `RODOVIA`, `RESIDENCIA`, `OUTRO`).
   - É obrigatório o fornecimento de coordenadas geográficas (`destino_latitude`, `destino_longitude`) no intervalo terrestre válido.
   - Ponto de referência detalhado (ex: "Marina da Glória, Píer B, Vaga 14 - Lancha Marlin") é essencial para a localização precisa do abastecimento no destino.
4. **Segregação por Perfil (RBAC)**:
   - Consumidores civis (`cliente`) só visualizam e operam seus próprios pedidos vinculados ao seu `usuario_id`.
   - Administradores do posto parceiro (`posto_admin`) gerenciam todos os pedidos atribuídos ao seu posto.
5. **Ciclo de Estados do Pedido**:
   - Estados: `PENDENTE` $\to$ `CONFIRMADO_POSTO` $\to$ `EM_PREPARACAO` $\to$ `EM_TRANSPORTE` $\to$ `CONCLUIDO` (ou `CANCELADO`).
   - O cliente só pode cancelar o pedido se o status ainda for `PENDENTE`. Quando o pedido entra em preparação ou transporte, o cancelamento é bloqueado para evitar desperdício logístico.
