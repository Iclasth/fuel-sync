# Modulo de Postos de Abastecimento (src/modules/stations)

Este modulo gerencia as bases de abastecimento parceiras da plataforma FuelSync, isolamento multi-tenant, tabelas de precos vigentes por posto e auditoria de reajustes tarifarios.

---

## 1. Regras de Negocio

1. **Identificacao Fiscal**:
   - Cada posto deve possuir um CNPJ valido e exclusivo cadastrado na base.
   - O CNPJ e validado matematicamente com base nos 14 digitos e seus digitos verificadores.

2. **Localizacao Geografica da Base**:
   - A latitude deve estar entre -90 e 90 graus.
   - A longitude deve estar entre -180 e 180 graus.
   - Esta coordenada serve como ponto de origem e retorno no ciclo logistico Hub-and-Spoke.

3. **Tempo Medio de Preparo (tempo_medio_preparo_minutos)**:
   - O tempo de preparo padrao e de 12 a 15 minutos (bombeamento nos tanques do utilitario, conferencia e lacre).
   - O valor e utilizado pelo motor de telemetria na predicao do ETA de entrega.

4. **Multi-tenant e Gestao de Precos por Posto**:
   - Cada posto define seus proprios precos por litro, estoque disponivel e status de disponibilidade na tabela `posto_combustiveis`.
   - Administradores de posto (`posto_admin`) so podem alterar precos e combustiveis de postos aos quais estao expressamente vinculados na tabela `posto_administradores`.
   - Administradores gerais (`admin_geral`) possuem acesso irrestrito a todos os postos.

5. **Auditoria Transacional via Trigger PostgreSQL**:
   - Qualquer insercao ou alteracao na coluna `preco_litro` de `posto_combustiveis` dispara automaticamente a trigger nativa `trg_audit_preco_combustivel` (`trg_fn_log_historico_preco`).
   - A trigger persiste o valor anterior e o novo valor na tabela `historico_precos_combustivel`, garantindo rastreabilidade independente de aplicacao.

---

## 2. Endpoints Disponiveis

- `GET /api/v1/stations`: Lista postos ativos homologados.
- `POST /api/v1/stations`: Cadastra novo posto (restrito a `posto_admin` e `admin_geral`).
- `GET /api/v1/stations/:id`: Detalhes do posto especificado.
- `PUT /api/v1/stations/:id`: Atualiza dados cadastrais do posto.
- `GET /api/v1/stations/:stationId/fuels`: Lista combustiveis e tarifas vigentes do posto.
- `POST /api/v1/stations/:stationId/fuels`: Adiciona combustivel ao catalogo do posto.
- `PUT /api/v1/stations/:stationId/fuels/:combustivelId`: Atualiza preco por litro, estoque e disponibilidade.
- `GET /api/v1/stations/:stationId/fuels/:combustivelId/history`: Consulta o historico cronologico auditado de reajustes.
- `GET /api/v1/stations/:stationId/admins`: Lista administradores associados ao posto.
- `POST /api/v1/stations/:stationId/admins`: Vincula usuario `posto_admin` ao posto (restrito a `admin_geral`).
