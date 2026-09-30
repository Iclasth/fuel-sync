const {
    Station,
    Courier,
    Fuel,
    Customer,
    Order,
    OrderItem,
    Delivery,
    AIPrediction,
    DeliveryStatusHistory,
    UserProfile
} = require('../../src/common/entities');
const { DeliveryStatus, OrderStatus, CourierStatus, UserRoles, LocationType } = require('../../src/common/constants/enums');

describe('Unit: Domain Entities (src/common/entities)', () => {
    describe('Station Entity', () => {
        const validStationData = {
            id: 1,
            nome_fantasia: 'Posto Marina Náutica',
            razao_social: 'Marina Náutica Combustíveis LTDA',
            cnpj: '11.222.333/0001-81',
            telefone: '21988887777',
            endereco: 'Av. das Américas, 1000',
            latitude: -23.000371,
            longitude: -43.365894,
            tempo_medio_preparo_minutos: 15,
            ativo: true
        };

        it('TC-DOM-ST-01: deve instanciar Station com dados válidos e normalizar campos', () => {
            const station = new Station(validStationData);
            expect(station.nome_fantasia).toBe('Posto Marina Náutica');
            expect(station.cnpj).toBe('11222333000181');
            expect(station.tempo_medio_preparo_minutos).toBe(15);
            expect(station.ativo).toBe(true);
            expect(station.toJSON()).toHaveProperty('latitude', -23.000371);
        });

        it('TC-DOM-ST-02: deve rejeitar Station com CNPJ inválido', () => {
            expect(() => new Station({ ...validStationData, cnpj: '00000000000000' })).toThrow(/CNPJ inválido/i);
        });

        it('TC-DOM-ST-03: deve rejeitar Station com coordenadas fora dos limites', () => {
            expect(() => new Station({ ...validStationData, latitude: 95 })).toThrow(/latitude/i);
            expect(() => new Station({ ...validStationData, longitude: -190 })).toThrow(/longitude/i);
        });

        it('TC-DOM-ST-04: deve rejeitar Station com tempo de preparo negativo', () => {
            expect(() => new Station({ ...validStationData, tempo_medio_preparo_minutos: -5 })).toThrow(/tempo_medio_preparo_minutos.*maior ou igual a zero/i);
        });
    });

    describe('Courier Entity', () => {
        const validCourierData = {
            id: 10,
            usuario_id: 'uuid-courier-123',
            posto_id: 1,
            nome: 'Marcos Entregador',
            cpf: '52998224725',
            telefone: '21977778888',
            veiculo_descricao: 'Furgão Renault Master com tanque 1000L homologado',
            placa: 'ABC1D23',
            status: CourierStatus.DISPONIVEL,
            ultima_latitude: -22.9068,
            ultima_longitude: -43.1729
        };

        it('TC-DOM-CR-01: deve instanciar Courier com dados válidos e normalizar CPF', () => {
            const courier = new Courier(validCourierData);
            expect(courier.nome).toBe('Marcos Entregador');
            expect(courier.cpf).toBe('52998224725');
            expect(courier.status).toBe(CourierStatus.DISPONIVEL);
            expect(courier.isAvailable()).toBe(true);
        });

        it('TC-DOM-CR-02: deve permitir atualizar localização com coordenadas válidas', () => {
            const courier = new Courier(validCourierData);
            courier.updateLocation(-22.9100, -43.1800);
            expect(courier.ultima_latitude).toBe(-22.9100);
            expect(courier.ultima_longitude).toBe(-43.1800);
            expect(courier.ultima_posicao_em).toBeInstanceOf(Date);
        });

        it('TC-DOM-CR-03: deve atualizar status operacional', () => {
            const courier = new Courier(validCourierData);
            courier.setStatus(CourierStatus.EM_ROTA);
            expect(courier.status).toBe(CourierStatus.EM_ROTA);
            expect(courier.isAvailable()).toBe(false);
        });

        it('TC-DOM-CR-04: deve rejeitar status operacional inválido', () => {
            const courier = new Courier(validCourierData);
            expect(() => courier.setStatus('STATUS_INEXISTENTE')).toThrow(/status inválido/i);
        });
    });

    describe('Fuel Entity', () => {
        it('TC-DOM-FL-01: deve instanciar Fuel com dados válidos', () => {
            const fuel = new Fuel({ id: 1, nome: 'Gasolina Comum', unidade_medida: 'LITROS' });
            expect(fuel.nome).toBe('Gasolina Comum');
            expect(fuel.unidade_medida).toBe('LITROS');
        });

        it('TC-DOM-FL-02: deve rejeitar Fuel sem nome', () => {
            expect(() => new Fuel({ unidade_medida: 'LITROS' })).toThrow(/nome.*obrigatório/i);
        });
    });

    describe('Customer Entity', () => {
        const validCustomerData = {
            id: 1,
            usuario_id: 'uuid-customer-1',
            nome: 'Ana Cliente',
            cpf: '52998224725',
            email: 'ana@cliente.com',
            telefone: '21966665555',
            endereco_padrao: 'Marina da Glória',
            ponto_referencia_padrao: 'Píer 3, vaga 12',
            latitude: -22.9200,
            longitude: -43.1700
        };

        it('TC-DOM-CS-01: deve instanciar Customer com dados válidos', () => {
            const customer = new Customer(validCustomerData);
            expect(customer.nome).toBe('Ana Cliente');
            expect(customer.cpf).toBe('52998224725');
            expect(customer.email).toBe('ana@cliente.com');
            expect(customer.toJSON()).toHaveProperty('ponto_referencia_padrao', 'Píer 3, vaga 12');
        });

        it('TC-DOM-CS-02: deve rejeitar Customer com CPF inválido', () => {
            expect(() => new Customer({ ...validCustomerData, cpf: '12345678900' })).toThrow(/CPF inválido/i);
        });
    });

    describe('Order & OrderItem Entities', () => {
        it('TC-DOM-ORD-01: deve instanciar OrderItem e calcular subtotal', () => {
            const item = new OrderItem({
                pedido_id: 1,
                combustivel_id: 2,
                quantidade_litros: 100,
                valor_unitario: 6.50
            });
            expect(item.quantidade_litros).toBe(100);
            expect(item.valor_unitario).toBe(6.50);
            expect(item.subtotal).toBe(650.00);
        });

        it('TC-DOM-ORD-02: deve instanciar Order com localização e validar coordenadas', () => {
            const order = new Order({
                id: 100,
                cliente_id: 1,
                posto_id: 2,
                status: OrderStatus.PENDENTE,
                valor_total: 650.00,
                endereco_entrega: 'Marina da Glória, Píer B',
                ponto_referencia: 'Lancha Bravo',
                tipo_local: LocationType.MARINA,
                destino_latitude: -22.9200,
                destino_longitude: -43.1700
            });
            expect(order.status).toBe(OrderStatus.PENDENTE);
            expect(order.tipo_local).toBe(LocationType.MARINA);
            expect(order.valor_total).toBe(650.00);
        });

        it('TC-DOM-ORD-03: deve rejeitar Order com tipo_local desconhecido', () => {
            expect(() => new Order({
                cliente_id: 1,
                posto_id: 2,
                endereco_entrega: 'Local X',
                tipo_local: 'DESCONHECIDO',
                destino_latitude: -22.92,
                destino_longitude: -43.17
            })).toThrow(/tipo_local.*inválido/i);
        });
    });

    describe('Delivery Entity', () => {
        const validDeliveryData = {
            id: 50,
            pedido_id: 100,
            entregador_id: 10,
            ordem_na_fila: 1,
            status_entrega: DeliveryStatus.AGENDADO
        };

        it('TC-DOM-DEL-01: deve instanciar Delivery e permitir transição válida pela máquina de estados', () => {
            const delivery = new Delivery(validDeliveryData);
            expect(delivery.status_entrega).toBe(DeliveryStatus.AGENDADO);
            delivery.transitionTo(DeliveryStatus.PREPARANDO_POSTO);
            expect(delivery.status_entrega).toBe(DeliveryStatus.PREPARANDO_POSTO);
            expect(delivery.data_inicio_preparo).toBeInstanceOf(Date);
        });

        it('TC-DOM-DEL-02: deve rejeitar transição proibida pela máquina de estados', () => {
            const delivery = new Delivery(validDeliveryData);
            expect(() => delivery.transitionTo(DeliveryStatus.CONCLUIDO)).toThrow(/transição de status inválida/i);
        });
    });

    describe('AIPrediction & DeliveryStatusHistory & UserProfile Entities', () => {
        it('TC-DOM-AIP-01: deve instanciar AIPrediction com métricas e texto humanizado', () => {
            const eta = new Date(Date.now() + 3600000);
            const prediction = new AIPrediction({
                entrega_id: 50,
                eta_previsto: eta,
                tempo_espera_liberacao_minutos: 10,
                tempo_preparo_posto_minutos: 12,
                tempo_viagem_cliente_minutos: 18,
                confianca_score: 0.96,
                risco_atraso: false,
                mensagem_humanizada: 'Seu combustível está sendo preparado no posto base.'
            });
            expect(prediction.confianca_score).toBe(0.96);
            expect(prediction.mensagem_humanizada).toMatch(/combustível está sendo preparado/i);
        });

        it('TC-DOM-HIST-01: deve instanciar DeliveryStatusHistory com auditoria', () => {
            const history = new DeliveryStatusHistory({
                entrega_id: 50,
                status_anterior: DeliveryStatus.AGENDADO,
                status_novo: DeliveryStatus.PREPARANDO_POSTO,
                origem_alteracao: 'POSTO_WEB',
                descricao_motivo: 'Iniciando bombeamento no tanque'
            });
            expect(history.status_novo).toBe(DeliveryStatus.PREPARANDO_POSTO);
            expect(history.origem_alteracao).toBe('POSTO_WEB');
        });

        it('TC-DOM-USR-01: deve instanciar UserProfile com papel de segurança', () => {
            const profile = new UserProfile({
                id: 'uuid-usr-1',
                email: 'admin@posto.com',
                nome: 'Admin Posto',
                role: UserRoles.POSTO_ADMIN
            });
            expect(profile.role).toBe(UserRoles.POSTO_ADMIN);
            expect(profile.isAdmin()).toBe(true);
        });
    });
});
