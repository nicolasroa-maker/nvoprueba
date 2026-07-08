import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'data', 'nvo.db');

// Asegurar que existe el directorio data/
fs.mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ── Esquema ──
db.exec(`
  CREATE TABLE IF NOT EXISTS kv_shared (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS kv_local (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── API key-value (reemplaza window.storage) ──

// GET  /api/store/:key?shared=true|false
app.get('/api/store/:key', (req, res) => {
  const { key } = req.params;
  const shared = req.query.shared === 'true';
  const table = shared ? 'kv_shared' : 'kv_local';
  const row = db.prepare(`SELECT value FROM ${table} WHERE key = ?`).get(key);
  if (row) {
    res.json({ key, value: row.value, shared });
  } else {
    res.json(null);
  }
});

// PUT  /api/store/:key  body: { value, shared }
app.put('/api/store/:key', (req, res) => {
  const { key } = req.params;
  const { value, shared } = req.body;
  const table = shared ? 'kv_shared' : 'kv_local';
  db.prepare(`INSERT OR REPLACE INTO ${table} (key, value) VALUES (?, ?)`).run(key, value);
  res.json({ key, value, shared });
});

// DELETE /api/store/:key?shared=true|false
app.delete('/api/store/:key', (req, res) => {
  const { key } = req.params;
  const shared = req.query.shared === 'true';
  const table = shared ? 'kv_shared' : 'kv_local';
  db.prepare(`DELETE FROM ${table} WHERE key = ?`).run(key);
  res.json({ ok: true });
});

// ── En producción: servir el frontend compilado (dist/) ──
const distPath = join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: cualquier ruta no-API devuelve index.html
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
  console.log('📦 Sirviendo frontend desde dist/');
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ NVO API server corriendo en http://0.0.0.0:${PORT}`);
  console.log(`   Base de datos: ${DB_PATH}`);
});
