# Módulo de Postos de Abastecimento (`src/modules/stations`)

Este módulo gerencia as bases de abastecimento parceiras da plataforma Fuel-Sync.

---

## 1. Regras de Negócio

1. **Identificação Fiscal**:
   - Cada posto deve possuir um CNPJ válido e exclusivo cadastrado na base.
   - O CNPJ é validado matematicamente com base nos 14 dígitos e seus dígitos verificadores.
2. **Localização Geográfica da Base**:
   - A latitude deve estar entre -90 e 90 graus.
   - A longitude deve estar entre -180 e 180 graus.
   - Esta coordenada serve como ponto de origem e retorno no ciclo logístico Hub-and-Spoke.
3. **Tempo Médio de Preparo (`tempo_medio_preparo_minutos`)**:
   - O tempo de preparo padrão é de 12 minutos (bombeamento nos tanques do utilitário, conferência e lacre).
   - O valor não pode ser negativo e é utilizado pelo motor de IA na predição do ETA.
4. **Controle de Acesso (RBAC)**:
   - Criação (`POST /api/v1/stations`) e edição (`PUT /api/v1/stations/:id`): restritas a administradores (`posto_admin`).
   - Leitura (`GET /api/v1/stations`, `GET /api/v1/stations/:id`): acessível a usuários autenticados (`cliente`, `posto_admin`, `entregador`).
