/**
 * 数据库管理 — 使用 Node 22 内置 SQLite
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const config = require('./config');

const DB_PATH = config.db;

let db = null;

function getDb() {
  if (db) return db;
  
  // 确保目录存在
  const dir = path.dirname(DB_PATH);
  require('fs').mkdirSync(dir, { recursive: true });
  
  db = new DatabaseSync(DB_PATH);
  db.exec(`PRAGMA journal_mode=WAL`);
  
  // 建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      patreon_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT,
      tier TEXT,
      tier_cents INTEGER DEFAULT 1000,
      joined_at TEXT NOT NULL,
      last_batch_sent INTEGER DEFAULT 0,
      last_daily_sent INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT NOT NULL,
      chapter_num INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('batch','daily')),
      sent_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(member_id) REFERENCES members(patreon_id)
    )
  `);
  
  return db;
}

function addMember({ patreonId, email, fullName, tier, tierCents }) {
  const db = getDb();
  const existing = db.prepare('SELECT patreon_id FROM members WHERE patreon_id = ?').get(patreonId);
  if (existing) return false;
  
  db.prepare(`
    INSERT INTO members (patreon_id, email, full_name, tier, tier_cents, joined_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(patreonId, email, fullName || email, tier || 'Scarred', tierCents || 1000);
  
  return true;
}

function getActiveMembers() {
  const db = getDb();
  return db.prepare('SELECT * FROM members WHERE active = 1').all();
}

function getMember(patreonId) {
  const db = getDb();
  return db.prepare('SELECT * FROM members WHERE patreon_id = ?').get(patreonId);
}

function getMemberByEmail(email) {
  const db = getDb();
  return db.prepare('SELECT * FROM members WHERE email = ?').get(email);
}

function updateMember(patreonId, updates) {
  const db = getDb();
  const sets = Object.entries(updates).map(([k]) => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE members SET ${sets} WHERE patreon_id = ?`).run(...values, patreonId);
}

function recordDelivery(memberId, chapterNum, type) {
  const db = getDb();
  db.prepare('INSERT INTO deliveries (member_id, chapter_num, type) VALUES (?, ?, ?)').run(memberId, chapterNum, type);
}

function wasChapterSent(memberId, chapterNum) {
  const db = getDb();
  const row = db.prepare('SELECT id FROM deliveries WHERE member_id = ? AND chapter_num = ?').get(memberId, chapterNum);
  return !!row;
}

function getLastDelivery(memberId) {
  const db = getDb();
  const row = db.prepare('SELECT MAX(chapter_num) as last_ch FROM deliveries WHERE member_id = ?').get(memberId);
  return row?.last_ch || 0;
}

function updateLastBatchSent(patreonId, chapterNum) {
  updateMember(patreonId, { last_batch_sent: chapterNum });
  recordDelivery(patreonId, chapterNum, 'batch');
}

function updateLastDailySent(patreonId, chapterNum) {
  updateMember(patreonId, { last_daily_sent: chapterNum });
  recordDelivery(patreonId, chapterNum, 'daily');
}

function close() {
  if (db) { db.close(); db = null; }
}

module.exports = {
  getDb, addMember, getActiveMembers, getMember, getMemberByEmail,
  updateMember, recordDelivery, wasChapterSent, getLastDelivery,
  updateLastBatchSent, updateLastDailySent, close
};
