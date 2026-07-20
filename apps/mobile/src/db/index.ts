import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('mineria.db');

// Bootstrap idempotente. Cuando el schema crezca (S4) migramos a
// drizzle-kit + useMigrations; por ahora esto mantiene el setup simple.
expoDb.execSync(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS dsr_drafts (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    client_timestamp INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sync_queue_entity
    ON sync_queue (entity_type, entity_id);
`);

export const db = drizzle(expoDb, { schema });
export { schema };
