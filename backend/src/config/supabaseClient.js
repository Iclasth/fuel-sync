const { createClient } = require('@supabase/supabase-js');
if (!global.WebSocket) {
    global.WebSocket = require('ws');
}
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.warn('⚠️  [AVISO] SUPABASE_URL ou SUPABASE_KEY não foram definidos nas variáveis de ambiente (.env).');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;