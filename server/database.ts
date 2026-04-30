import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'reports_creator.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    -- Company Settings
    CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      company_name TEXT NOT NULL DEFAULT 'Mi Empresa',
      logo_url TEXT DEFAULT '',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      website TEXT DEFAULT '',
      report_prefix TEXT DEFAULT 'SVC',
      primary_color TEXT DEFAULT '#C8102E',
      secondary_color TEXT DEFAULT '#1A1A2E',
      footer_text TEXT DEFAULT ''
    );

    -- Technicians
    CREATE TABLE IF NOT EXISTS technicians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      signature TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Equipment
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      category TEXT NOT NULL,
      serial_number TEXT DEFAULT '',
      location TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Templates (blocks + variables stored as JSON for flexibility)
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      blocks TEXT NOT NULL DEFAULT '[]',
      version INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    -- Reports
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      report_number TEXT NOT NULL UNIQUE,
      equipment_id TEXT NOT NULL,
      equipment_name TEXT NOT NULL,
      template_id TEXT NOT NULL,
      template_name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      technician TEXT NOT NULL DEFAULT '',
      supervisor_name TEXT DEFAULT '',
      service_date TEXT NOT NULL,
      next_service_date TEXT DEFAULT '',
      general_observations TEXT DEFAULT '',
      blocks TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    -- Report layouts (customizable print formats)
    CREATE TABLE IF NOT EXISTS report_layouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      show_logo INTEGER DEFAULT 1,
      show_company_info INTEGER DEFAULT 1,
      show_equipment_image INTEGER DEFAULT 0,
      show_block_numbers INTEGER DEFAULT 1,
      show_signature_lines INTEGER DEFAULT 1,
      header_layout TEXT DEFAULT 'two-column',
      block_style TEXT DEFAULT 'card',
      font_size TEXT DEFAULT 'medium',
      page_size TEXT DEFAULT 'letter',
      margins TEXT DEFAULT '{"top":20,"right":15,"bottom":20,"left":15}',
      custom_css TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Report number counter
    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );

    -- Initialize default settings if not exists
    INSERT OR IGNORE INTO company_settings (id) VALUES ('default');
    INSERT OR IGNORE INTO counters (name, value) VALUES ('report_number', 0);

    -- Initialize default layout
    INSERT OR IGNORE INTO report_layouts (id, name) VALUES ('default', 'Formato Estándar');
  `);

  console.log('✅ Database initialized successfully');
}

export function getNextReportNumber(): string {
  const stmt = db.prepare('UPDATE counters SET value = value + 1 WHERE name = ? RETURNING value');
  const result = stmt.get('report_number') as { value: number };
  const year = new Date().getFullYear();
  const settings = db.prepare('SELECT report_prefix FROM company_settings WHERE id = ?').get('default') as { report_prefix: string } | undefined;
  const prefix = settings?.report_prefix || 'SVC';
  return `${prefix}-${year}-${String(result.value).padStart(4, '0')}`;
}

export default db;
