const fs = require('fs');
const path = require('path');

describe('Integration: Database Schema & DDL Integrity', () => {
    const rootDir = path.resolve(__dirname, '../../');
    const migrationPath = path.join(rootDir, 'database/migrations/001_initial_b2c_schema.sql');
    const seedPath = path.join(rootDir, 'database/seeds/001_seed_initial_data.sql');
    const schemeTxtPath = path.join(rootDir, 'scheme.txt');
    const readmePath = path.join(rootDir, 'database/README.md');

    it('TC-SCHEMA-01: o arquivo DDL de migração deve existir e definir as 10 tabelas obrigatórias', () => {
        expect(fs.existsSync(migrationPath)).toBe(true);
        const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

        const requiredTables = [
            'perfis_usuarios',
            'postos',
            'clientes',
            'entregadores',
            'combustiveis',
            'pedidos',
            'itens_pedido',
            'entregas',
            'previsoes_ia',
            'historico_status_entrega'
        ];

        for (const table of requiredTables) {
            const tableRegex = new RegExp(`CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${table}\\b`, 'i');
            expect(sqlContent).toMatch(tableRegex);
        }
    });

    it('TC-SCHEMA-02: o script DDL deve conter constraints de coordenadas e índices de fila e IA', () => {
        const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

        expect(sqlContent).toMatch(/latitude.*BETWEEN\s+-90\s+AND\s+90/i);
        expect(sqlContent).toMatch(/longitude.*BETWEEN\s+-180\s+AND\s+180/i);
        expect(sqlContent).toMatch(/idx_entregas_fila/i);
        expect(sqlContent).toMatch(/idx_previsoes_entrega/i);
        expect(sqlContent).toMatch(/idx_historico_entrega/i);
    });

    it('TC-SCHEMA-03: o script de seeds deve existir e conter os combustíveis padrão', () => {
        expect(fs.existsSync(seedPath)).toBe(true);
        const seedContent = fs.readFileSync(seedPath, 'utf-8');

        expect(seedContent).toMatch(/Gasolina Comum/i);
        expect(seedContent).toMatch(/Gasolina Podium/i);
        expect(seedContent).toMatch(/Diesel N[aá]utico/i);
        expect(seedContent).toMatch(/Etanol/i);
    });

    it('TC-SCHEMA-04: scheme.txt deve estar atualizado no formato DBML com entidades B2C e Hub-and-Spoke', () => {
        expect(fs.existsSync(schemeTxtPath)).toBe(true);
        const dbmlContent = fs.readFileSync(schemeTxtPath, 'utf-8');

        expect(dbmlContent).toMatch(/Table\s+PerfisUsuarios/i);
        expect(dbmlContent).toMatch(/Table\s+Postos/i);
        expect(dbmlContent).toMatch(/Table\s+Clientes/i);
        expect(dbmlContent).toMatch(/Table\s+Entregadores/i);
        expect(dbmlContent).toMatch(/Table\s+Entregas/i);
        expect(dbmlContent).toMatch(/Table\s+PrevisoesIA/i);
        expect(dbmlContent).toMatch(/RETORNANDO_AO_POSTO/i);
        expect(dbmlContent).toMatch(/PREPARANDO_POSTO/i);
    });

    it('TC-SCHEMA-05: o diretório database deve conter README.md com dicionário de dados', () => {
        expect(fs.existsSync(readmePath)).toBe(true);
        const readmeContent = fs.readFileSync(readmePath, 'utf-8');

        expect(readmeContent).toMatch(/Dicion[aá]rio de Dados/i);
        expect(readmeContent).toMatch(/postos/i);
        expect(readmeContent).toMatch(/entregas/i);
        expect(readmeContent).toMatch(/previsoes_ia/i);
    });
});
