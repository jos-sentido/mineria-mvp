import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// S1-MOB-04: entidades locales para captura offline.
// El schema real de DSR llega en S4; aquí van los cimientos del sync.

/** Borradores de DSR capturados offline (payload completo en JSON). */
export const dsrDrafts = sqliteTable('dsr_drafts', {
  id: text('id').primaryKey(), // uuid v4 generado en cliente
  payload: text('payload', { mode: 'json' }).notNull(),
  status: text('status', { enum: ['DRAFT', 'QUEUED', 'SYNCED'] })
    .notNull()
    .default('DRAFT'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

/** Cola de sincronización con reintentos (S5-MOB-01 la consumirá). */
export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation', { enum: ['CREATE', 'UPDATE', 'DELETE'] }).notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  clientTimestamp: integer('client_timestamp', { mode: 'timestamp_ms' }).notNull(),
});
