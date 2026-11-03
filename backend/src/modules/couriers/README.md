# Módulo de Entregadores (`src/modules/couriers`)

Este módulo gerencia os condutores credenciados responsáveis pelo transporte de combustível no modelo Hub-and-Spoke.

---

## 1. Regras de Negócio

1. **Credenciamento e Vínculo Operacional**:
   - Cada entregador está vinculado a uma base/posto de abastecimento (`posto_id`).
   - O entregador opera utilitário/furgão leve equipado com tanques fracionados homologados pelas normas de segurança vigentes.
2. **Status de Disponibilidade (`CourierStatus`)**:
   - `DISPONIVEL`: Condutor na base pronto para ser alocado em nova entrega.
   - `EM_ROTA`: Condutor em trânsito executando etapas do ciclo (`PREPARANDO_POSTO`, `A_CAMINHO`, `NO_LOCAL_ABASTECENDO`, `RETORNANDO_AO_POSTO`).
   - `INDISPONIVEL`: Condutor fora de expediente, em intervalo ou em manutenção.
3. **Telemetria de Baixa Frequência**:
   - A plataforma não utiliza streaming contínuo de alta frequência.
   - A posição geográfica é enviada pontualmente (`PATCH /api/v1/couriers/:id/location`) na saída do posto, chegada no cliente, início do retorno ou check-in periódico.
4. **Controle de Acesso (RBAC)**:
   - Consulta de lista de entregadores: restrita a `posto_admin`.
   - Consulta de perfil e status: permitida a `posto_admin` e ao próprio `entregador`.
   - Envio de coordenadas: exclusivo do perfil `entregador`.
