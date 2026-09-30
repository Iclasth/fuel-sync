# Módulo de Catálogo de Combustíveis (`src/modules/catalog`)

Este módulo gerencia os tipos de combustíveis padronizados e homologados para distribuição civil (embarcações em marinas, geradores em condomínios e chácaras).

---

## 1. Regras de Negócio

1. **Combustíveis Padrão**:
   - `Gasolina Comum`: Veículos de apoio, geradores residenciais e emergências.
   - `Gasolina Podium`: Motores marítimos de alta taxa de compressão e geradores de precisão.
   - `Diesel Náutico S10`: Lanchas, iates, embarcações e geradores pesados de condomínios.
   - `Etanol Hidratado`: Motores flex e equipamentos específicos.
2. **Unidade de Medida Padrão**:
   - Todo abastecimento e precificação operam na unidade `LITROS`.
3. **Controle de Exclusividade**:
   - O nome do combustível deve ser exclusivo no catálogo.
4. **Controle de Acesso (RBAC)**:
   - Consulta (`GET /api/v1/catalog/fuels`, `GET /api/v1/catalog/fuels/:id`): aberta a todos os usuários autenticados (`cliente`, `posto_admin`, `entregador`).
   - Cadastro (`POST /api/v1/catalog/fuels`): exclusivo de administradores de postos (`posto_admin`).
