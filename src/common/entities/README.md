# Camada de Entidades de Domínio (`src/common/entities`)

Este diretório contém a modelagem conceitual e as classes formais de domínio da API do Fuel-Sync. Cada classe encapsula seus atributos, regras de negócio e validações de integridade, desacoplando a lógica de domínio dos detalhes de persistência e do framework HTTP.

---

## 1. Entidades Modeladas

| Entidade | Arquivo | Tabela SQL Equivalente | Responsabilidade Principal |
| :--- | :--- | :--- | :--- |
| **`Station`** | `Station.js` | `postos` | Base de abastecimento parceira, validação de CNPJ, tempo médio de preparo e coordenadas geográficas da base. |
| **`Courier`** | `Courier.js` | `entregadores` | Motorista credenciado pelo posto, dados do veículo/placa, disponibilidade operacional (`DISPONIVEL`, `EM_ROTA`, `INDISPONIVEL`) e atualização de telemetria/posição. |
| **`Fuel`** | `Fuel.js` | `combustiveis` | Catálogo de tipos de combustíveis disponíveis (Gasolina Comum, Gasolina Podium, Diesel Náutico S10, Etanol Hidratado) em litros. |
| **`Customer`** | `Customer.js` | `clientes` | Consumidor civil final (pessoa física), validação de CPF, coordenadas padrão e ponto de referência (marina, vaga, píer). |
| **`Order`** | `Order.js` | `pedidos` | Cabeçalho do pedido de abastecimento civil, coordenadas de destino e tipo de local (`MARINA`, `CONDOMINIO`, `CHACARA`, `RODOVIA`, etc.). |
| **`OrderItem`** | `OrderItem.js` | `itens_pedido` | Linha de combustível solicitada, cálculo automático de subtotal (`quantidade_litros * valor_unitario`). |
| **`Delivery`** | `Delivery.js` | `entregas` | Ciclo logístico Posto $\to$ Cliente $\to$ Posto, ordem na fila do entregador e máquina de estados com registro temporal de marcos. |
| **`AIPrediction`** | `AIPrediction.js` | `previsoes_ia` | Estimativas da IA para o pedido: ETA, tempos decompostos (espera na base + preparo + viagem), score de confiança e texto humanizado. |
| **`DeliveryStatusHistory`** | `DeliveryStatusHistory.js` | `historico_status_entrega` | Auditoria imutável de cada alteração de status com origem, justificativa e coordenadas no momento. |
| **`UserProfile`** | `UserProfile.js` | `perfis_usuarios` | Perfil de usuário autenticado via Supabase Auth com seu papel de acesso (`cliente`, `posto_admin`, `entregador`). |

---

## 2. Invariantes de Domínio e Regras de Negócio

1. **Validação de Coordenadas Geográficas**:
   - Todas as latitudes devem estar no intervalo $[-90, 90]$ graus.
   - Todas as longitudes devem estar no intervalo $[-180, 180]$ graus.
2. **Validação de Identificadores Fiscais (CPF / CNPJ)**:
   - CPFs são validados pelo algoritmo dos dígitos verificadores módulo 11 (`cpfValidator.js`).
   - CNPJs são validados pelo algoritmo oficial de 14 dígitos com pesos 5..2 e 6..2 (`cnpjValidator.js`).
3. **Máquina de Estados de Entrega (Hub-and-Spoke)**:
   - A entidade `Delivery` impede transições arbitrárias através do método `transitionTo()`.
   - Transições válidas do fluxo normal:
     `AGENDADO` $\to$ `PREPARANDO_POSTO` $\to$ `A_CAMINHO` $\to$ `NO_LOCAL_ABASTECENDO` $\to$ `RETORNANDO_AO_POSTO` $\to$ `CONCLUIDO`.
   - Transições para `FALHA_CANCELADO` são permitidas a partir de qualquer estado ativo.
4. **Cálculos Monetários e de Volume**:
   - `OrderItem` garante que litros e valor unitário sejam números estritamente maiores que zero e calcula o subtotal com 2 casas decimais.
