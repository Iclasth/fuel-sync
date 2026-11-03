# Módulo de Inteligência Artificial e Telemetria Logística (`src/modules/ai`)

Este módulo é responsável pelo cálculo preditivo de tempo estimado de entrega (ETA), roteamento viário e náutico em malha real, decomposição de tempos operacionais, avaliação cognitiva de riscos e prescrição de diretrizes normativas de segurança (NR-20 e Normam-04/DPC) para a distribuição de combustíveis fracionados na plataforma NAVROTAS (FuelSync).

---

## 1. Visão Geral e Responsabilidades

- **Roteamento Viário Real:** Consulta ao serviço Open Source Routing Machine (OSRM) para obtenção de distâncias, durações reais de percurso e geometrias vetoriais em GeoJSON LineString.
- **Resiliência e Fallbacks Determinísticos:** Salvaguardas determinísticas instantâneas via fórmula de Haversine ajustada por tortuosidade (`1.35x`) e velocidade calibrada por tipo de destinação civil/marítima, ativadas em caso de falha de rede, erro HTTP ou timeout.
- **Decomposição Temporal Operacional:** Segmentação analítica da estimativa entre tempo de fila no posto (~12 min por pedido ativo), tempo de preparo e bombeamento volumétrico da carga (considerando litragem solicitada) e tempo de trânsito em rota.
- **Motor Cognitivo via Groq LPU:** Processamento de linguagem e inferência em hardware LPU com modelo padrão `openai/gpt-oss-120b` (fallback para `llama-3.1-8b-instant`), gerando mensagens contextualizadas para cada status do pedido e pontuações de confiança calibradas.
- **Janela de Entrega Probabilística:** Definição do intervalo de tolerância para recebimento da carga com folga dinâmica e formatação regionalizada (`APP_TIMEZONE`).
- **Diretrizes Normativas de Segurança:** Prescrição automatizada de salvaguardas operacionais em conformidade estrita com a **NR-20** (operações terrestres e industriais) e a **Normam-04/DPC** da Marinha do Brasil (operações marítimas em píeres e marinas).
- **Segurança em Profundidade:** Proteção contra BOLA/IDOR por controle de acesso relacional, higienização de Prompt Injection contra desvios de contexto, e proteção contra SSRF com bloqueio de endereços de metadados de nuvem e desativação de redirecionamentos.

---

## 2. Estrutura de Arquivos do Módulo

| Arquivo | Responsabilidade Técnica |
| :--- | :--- |
| [`aiRoutes.js`](./aiRoutes.js) | Definição das rotas Express protegidas por JWT (`authMiddleware`) e documentação OpenAPI/Swagger. |
| [`aiController.js`](./aiController.js) | Recepção das requisições HTTP, validação preliminar de parâmetros e orquestração da resposta. |
| [`aiService.js`](./aiService.js) | Lógica de negócio, autorização Anti-BOLA/IDOR, resolução de dados canônicos no PostgreSQL/Supabase, orquestração de roteamento, cálculo de métricas e persistência em `previsoes_ia`. |
| [`routingClient.js`](./routingClient.js) | Cliente HTTP do OSRM com decodificação GeoJSON, timeout defensivo (`5000ms`), guardrail de anomalia geográfica (> 100 km), proteção SSRF (`redirect: error`) e fallback Haversine. |
| [`etaCalculator.js`](./etaCalculator.js) | Funções puras de cálculo: distância geodésica (Haversine), fator de tortuosidade, decomposição temporal por fase (`ACEITE` vs. `ENTREGA`), janelas probabilísticas e matriz de segurança (NR-20 e Normam-04). |
| [`groqClient.js`](./groqClient.js) | Cliente HTTP do Groq Cloud LPU via `fetch` nativo com AbortSignal, sanitização de Prompt Injection, alternância de modelos e consolidação defensiva de saídas JSON. |
| [`fallbackGenerator.js`](./fallbackGenerator.js) | Gerador determinístico de mensagens, confiança e riscos de atraso para funcionamento 100% offline ou durante falhas de LLM. |

---

## 3. Especificação do Endpoint

### `POST /api/v1/ai/predict-eta`
Calcula a previsão cognitiva de tempo estimado de entrega, tempos decompostos, traçado geométrico e recomendações operacionais.

#### Autenticação e Segurança
- **Tipo:** Bearer Token JWT (`Authorization: Bearer <token>`).
- **Validação Anti-BOLA / IDOR:**
  - `cliente`: Pode consultar apenas pedidos cujo `cliente_id` pertença ao seu perfil de usuário autenticado.
  - `entregador`: Pode consultar apenas pedidos associados ao seu registro de entregador (`entregador_id`).
  - `posto_admin`: Pode consultar apenas pedidos pertencentes ao posto sob sua administração.
  - `admin_geral`: Auditoria e visualização ampla de qualquer pedido.

#### Corpo da Requisição (`Request Body`)
O endpoint aceita a resolução automática via `orderId` ou parâmetros explícitos de coordenadas:

```json
{
  "orderId": 42,
  "station": {
    "id": 1,
    "nome": "Posto Náutico Marina da Glória",
    "latitude": -22.9194,
    "longitude": -43.1697,
    "tempo_medio_preparo": 15
  },
  "destination": {
    "latitude": -22.9519,
    "longitude": -43.1843,
    "tipo_local": "MARINA",
    "ponto_referencia": "Píer C, Vaga 18"
  },
  "weatherConditions": "Céu aberto e mar calmo",
  "trafficCondition": "Normal",
  "setbackDescription": "Pequena retenção no canal de atracação"
}
```

> **Nota:** Quando `orderId` for informado, as coordenadas e dados do posto, destino e litragem são resolvidos canonicamente a partir do banco de dados, sendo `station` e `destination` opcionais.

#### Resposta de Sucesso (`HTTP 201 Created` / `HTTP 200 OK`)

```json
{
  "status": "success",
  "data": {
    "id": 128,
    "pedido_id": 42,
    "entrega_id": 15,
    "eta_previsto": "2026-11-03T18:45:00.000Z",
    "tempo_espera_liberacao_minutos": 12,
    "tempo_preparo_posto_minutos": 15,
    "tempo_viagem_cliente_minutos": 18,
    "confianca_score": 0.94,
    "risco_atraso": false,
    "fator_principal_risco": null,
    "mensagem_humanizada": "Operação em andamento dentro do cronograma previsto. Deslocamento viário em fluidez.",
    "criado_em": "2026-11-03T18:00:00.000Z",

    "horario_previsto_chegada": "2026-11-03T18:45:00.000Z",
    "tempo_espera": 12,
    "tempo_preparo": 15,
    "tempo_viagem": 18,
    "total_minutos": 45,
    "tempo_formatado": "45 min",
    "confianca": 94,
    "motivo_risco": null,
    "mensagem": "Operação em andamento dentro do cronograma previsto. Deslocamento viário em fluidez.",
    "distancia_km": 5.12,
    "distancia_linear_km": 3.64,
    "anomalia_distancia": false,
    "tipo_fase": "ENTREGA",
    "fila_pedidos": 1,
    "horario_baseline": "2026-11-03T18:45:00.000Z",
    "delta_atraso_minutos": 0,
    "tem_atraso_baseline": false,

    "fonte_roteamento": "OSRM",
    "rota_geometria": {
      "type": "LineString",
      "coordinates": [
        [-43.1697, -22.9194],
        [-43.1740, -22.9310],
        [-43.1843, -22.9519]
      ]
    },
    "janela_entrega": {
      "inicio": "2026-11-03T18:37:00.000Z",
      "fim": "2026-11-03T19:05:00.000Z",
      "formato_amigavel": "15:37 - 16:05"
    },
    "fatores_tempo": {
      "fila_minutos": 12,
      "preparo_minutos": 15,
      "transito_minutos": 18,
      "total_minutos": 45,
      "explicacao": "Fila no posto: 12 min | Preparo da carga: 15 min | Deslocamento em rota: 18 min"
    },
    "recomendacoes_seguranca": [
      "Desligar motores, geradores e circuitos elétricos da embarcação antes de iniciar o abastecimento (Normam-04/DPC).",
      "Conectar o cabo de equalização de potencial eletrostático antes da abertura do bocal do reservatório.",
      "Manter extintor de incêndio PQS ou CO2 desobstruído e pronto para uso imediato no píer.",
      "Proibir fumar ou acionar dispositivos não intrinsecamente seguros em um raio mínimo de 15 metros.",
      "Manter kit de mitigação com mantas absorventes a postos na linha d'água para contenção preventiva de hidrocarbonetos."
    ],
    "condicoes_operacionais": {
      "nivel_trafego": "MODERADO",
      "complexidade_acesso": "ALTA",
      "notas": "Operação em conformidade com os parâmetros normais"
    }
  }
}
```

#### Respostas de Erro

| Código HTTP | Causa | Exemplo de Resposta |
| :--- | :--- | :--- |
| `400 Bad Request` | Ausência de `orderId` e coordenadas incompletas de posto ou destino. | `{"status": "fail", "message": "Dados de posto e destino são obrigatórios para o cálculo de ETA."}` |
| `401 Unauthorized`| Token JWT ausente, expirado ou com assinatura inválida. | `{"status": "fail", "message": "Não autenticado."}` |
| `403 Forbidden`   | Violação de BOLA: usuário tenta consultar pedido de outro cliente ou posto. | `{"status": "error", "message": "Acesso negado: você não possui autorização para consultar este pedido."}` |
| `500 Internal Error` | Erro sistêmico irrecuperável de infraestrutura. | `{"status": "error", "message": "Erro interno ao processar predição de IA."}` |

---

## 4. Detalhamento dos Novos Campos de Resposta

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `rota_geometria` | `Object` (GeoJSON) | Objeto padrão GeoJSON `LineString` contendo a sequência de pares `[longitude, latitude]` descrevendo o trajeto real. Compatível nativamente com Leaflet, MapLibre e Turf.js. |
| `fonte_roteamento` | `String` (`OSRM` \| `HAVERSINE_FALLBACK`) | Identificador da origem do traçado: `OSRM` para roteamento real viário/marítimo ou `HAVERSINE_FALLBACK` para projeção com tortuosidade. |
| `janela_entrega` | `Object` | Delimitação probabilística do horário de chegada contendo `inicio` (ISO 8601), `fim` (ISO 8601) e `formato_amigavel` (ex: `15:30 - 16:00`). |
| `fatores_tempo` | `Object` | Decomposição granular dos minutos operacionais: `fila_minutos`, `preparo_minutos` (inclui bombeamento), `transito_minutos`, `total_minutos` e `explicacao` textual. |
| `recomendacoes_seguranca` | `Array<String>` | Lista de diretrizes técnicas mandatórias de segurança do trabalho e ambiental, personalizadas por tipo de local de entrega segundo a **NR-20** e a **Normam-04/DPC**. |
| `condicoes_operacionais` | `Object` | Diagnóstico de trânsito e acessibilidade do local: `nivel_trafego` (`FLUIDO`, `MODERADO`, `CONGESTIONADO_OU_ADVERSO`), `complexidade_acesso` (`PADRAO`, `ALTA`) e `notas`. |

---

## 5. Variáveis de Ambiente Pertinentes

As variáveis de configuração do módulo devem ser incluídas no arquivo `.env`:

```bash
# Provedor Cognitivo LLM (Groq Cloud)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TIMEOUT_MS=7000

# Roteamento Real e Cartografia (OSRM)
OSRM_BASE_URL=https://router.project-osrm.org
OSRM_TIMEOUT_MS=5000
ROUTING_TORTUOSITY_FACTOR=1.35

# Localização e Fuso Horário
APP_TIMEZONE=America/Sao_Paulo
```

### Explicação Técnica dos Parâmetros

- **`OSRM_BASE_URL`**: Endereço base do servidor OSRM. Padrão: `https://router.project-osrm.org`. Em ambientes produtivos com tráfego massivo, aponte para um container OSRM privado na VPC.
- **`OSRM_TIMEOUT_MS`**: Limite de tempo em milissegundos para a consulta HTTP ao OSRM (padrão: `5000`). Se expirado, o fallback determinístico é acionado automaticamente.
- **`APP_TIMEZONE`**: Identificador IANA de fuso horário utilizado para a formatação do intervalo amigável de entrega (padrão: `America/Sao_Paulo`).
- **`ROUTING_TORTUOSITY_FACTOR`**: Fator multiplicador geodésico (padrão: `1.35`) aplicado sobre a distância em linha reta nos cenários de fallback.
- **`GROQ_TIMEOUT_MS`**: Tempo limite de execução da inferência da IA no Groq LPU (padrão: `7000`).

---

## 6. Camada de Segurança e Resiliência

```
[Requisição do Cliente]
         │
         ▼
[Validação Anti-BOLA/IDOR] ──(Falha: 403 Forbidden)
         │
         ▼
[Cálculo Linear Haversine]
    ├── Distância > 100 km ──► [Alerta de Anomalia + Fallback Instantâneo]
    └── Distância <= 100 km
         │
         ▼
[Consulta OSRM (5.0s Timeout, Anti-SSRF, redirect: error)]
    ├── Falha / Timeout ──► [Fallback Haversine 1.35x com velocidade por local]
    └── Sucesso ──────────► [Geometria GeoJSON LineString]
         │
         ▼
[Sanitização de Prompt (Anti-Injection)]
         │
         ▼
[Groq LPU (7.0s Timeout, max_tokens: 900, JSON Mode)]
    ├── Falha / 404 / Timeout ──► [Fallback Determinístico Offline (NR-20 / Normam-04)]
    └── Sucesso ────────────────► [Mesclagem com Salvaguardas Defensivas]
         │
         ▼
[Persistência Canônica em previsoes_ia]
         │
         ▼
[Front-end Leaflet (WCAG 2.1 AA Contorno + Sanitização XSS em Popups)]
```

1. **Anti-SSRF:** `routingClient.js` valida se o protocolo da URL do OSRM é estritamente `http:` ou `https:`, proíbe o IP de metadados da AWS/GCP/Azure (`169.254.169.254`) e utiliza a diretiva `redirect: 'error'` no fetch nativo.
2. **Anti-Prompt Injection:** `groqClient.js` aplica regex defensiva eliminando quebras de linha e caracteres de quebra de estrutura JSON (`\ " ' { } [ ]`), com truncamento estrito de tamanho.
3. **Anti-XSS em Mapas:** Todo dado textual interpolado nos popups de mapa passa por `escapeHtml()` no componente `TrackingMap.jsx`.
4. **Proteção de Integridade do PostgreSQL:** Se a migração `006` não tiver sido aplicada e `pedido_id` for rejeitado (`PGRST204`), o serviço executa fallback gracioso para salvar pelo modelo legado sem derrubar a API.
