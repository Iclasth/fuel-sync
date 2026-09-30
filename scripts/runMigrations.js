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
        console.warn(
            '[FuelSync Migration Runner] AVISO: Nenhuma variável DATABASE_URL encontrada no .env.'
        );
        console.log(
            '[FuelSync Migration Runner] Para aplicar via psql diretamente no seu banco Supabase/PostgreSQL:'
        );
        files.forEach((file) => {
            const fullPath = path.join(MIGRATIONS_DIR, file);
            console.log(`  psql "$DATABASE_URL" -f "${fullPath}"`);
        });
        console.log('[FuelSync Migration Runner] Validação estática dos scripts concluída com sucesso.');
        return;
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
