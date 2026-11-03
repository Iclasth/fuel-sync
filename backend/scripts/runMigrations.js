/**
 * Runner de Migrações SQL (FuelSync)
 * Aplica arquivos de migração DDL em ordem sequencial no banco PostgreSQL / Supabase
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

async function runMigrations() {
    console.log('[FuelSync Migration Runner] Iniciando verificação de migrações...');

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.error(`[FuelSync Migration Runner] Diretório não encontrado: ${MIGRATIONS_DIR}`);
        process.exit(1);
    }

    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith('.sql'))
        .sort();

    console.log(`[FuelSync Migration Runner] Encontrados ${files.length} arquivos de migração:`);
    files.forEach((f) => console.log(`  - ${f}`));

    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (!dbUrl) {
        console.error(
            '[FuelSync Migration Runner] ERRO: Nenhuma variável de conexão (DATABASE_URL ou SUPABASE_DB_URL) encontrada no ambiente.'
        );
        console.error(
            '[FuelSync Migration Runner] Configure a variável DATABASE_URL (ex: postgresql://usuario:senha@host:5432/database) no seu arquivo .env para executar as migrações.'
        );
        process.exit(1);
    }

    for (const file of files) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        console.log(`\n[FuelSync Migration Runner] Executando: ${file}...`);
        try {
            execSync(`psql "${dbUrl}" -f "${filePath}"`, { stdio: 'inherit' });
            console.log(`[FuelSync Migration Runner] Sucesso: ${file}`);
        } catch (error) {
            console.error(`[FuelSync Migration Runner] Falha ao executar migração ${file}:`, error.message);
            process.exit(1);
        }
    }

    console.log('\n[FuelSync Migration Runner] Todas as migrações foram aplicadas com sucesso!');
}

runMigrations().catch((err) => {
    console.error('[FuelSync Migration Runner] Erro fatal:', err);
    process.exit(1);
});
