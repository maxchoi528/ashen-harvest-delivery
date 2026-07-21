/**
 * Database — multi-book delivery tracking
 * Uses Node 22 built-in SQLite (node:sqlite)
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const config = require('./config');

const DB_PATH = config.db;
let db = null;

function getDb() {
  if (db) return db;
  require('fs').mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode=WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      patreon_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT,
      tier_id TEXT,
      tier_title TEXT,
      tier_cents INTEGER DEFAULT 1000,
      joined_at TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      chapter_num INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('batch','daily')),
      sent_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(member_id) REFERENCES members(patreon_id)
    )
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_unique
    ON deliveries(member_id, book_id, chapter_num)
  `);

  return db;
}

function addMember({ patreonId, email, fullName, tierId, tierTitle, tierCents }) {
  const d = getDb();
  const existing = d.prepare('SELECT patreon_id FROM members WHERE patreon_id = ?').get(patreonId);
  if (existing) return false;
  d.prepare(`INSERT INTO members (patreon_id, email, full_name, tier_id, tier_title, tier_cents, joined_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`)
    .run(patreonId, email, fullName || email, tierId || '', tierTitle || '', tierCents || 1000);
  return true;
}

function getMember(patreonId) {
  return getDb().prepare('SELECT * FROM members WHERE patreon_id = ?').get(patreonId);
}

function updateMember(patreonId, updates) {
  const d = getDb();
  const sets = Object.entries(updates).map(([k]) => `${k} = ?`).join(', ');
  d.prepare(`UPDATE members SET ${sets} WHERE patreon_id = ?`).run(...Object.values(updates), patreonId);
}

function getLastSentChapter(memberId, bookId) {
  const row = getDb().prepare('SELECT MAX(chapter_num) as last_ch FROM deliveries WHERE member_id = ? AND book_id = ?').get(memberId, bookId);
  return row?.last_ch || 0;
}

function wasChapterSent(memberId, bookId, chapterNum) {
  return !!getDb().prepare('SELECT id FROM deliveries WHERE member_id = ? AND book_id = ? AND chapter_num = ?').get(memberId, bookId, chapterNum);
}

function recordDelivery(memberId, bookId, chapterNum, type) {
  getDb().prepare('INSERT OR IGNORE INTO deliveries (member_id, book_id, chapter_num, type) VALUES (?, ?, ?, ?)').run(memberId, bookId, chapterNum, type);
}

function close() { if (db) { db.close(); db = null; } }

module.exports = {
  getDb, addMember, getMember, updateMember,
  getLastSentChapter, wasChapterSent, recordDelivery, close,
};
