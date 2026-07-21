/**
 * Chapter management — multi-book support
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

const OUTBOX = path.join(__dirname, 'outbox');

function getPublicCount(bookId) {
  return config.getPublicCount(bookId);
}

function calculateBatch(bookId) {
  const book = config.BOOKS[bookId];
  const pub = getPublicCount(bookId);
  const start = pub + 1;
  const end = Math.min(pub + book.aheadCount, book.totalChapters);
  const batch = [];
  for (let i = start; i <= end; i++) batch.push(i);
  return batch;
}

function getNextChapter(bookId, lastSent) {
  const book = config.BOOKS[bookId];
  const next = lastSent + 1;
  if (next > book.totalChapters) return null;
  return next;
}

function prepareChapter(bookId, chapterNum) {
  const book = config.BOOKS[bookId];
  const padded = String(chapterNum).padStart(3, '0');
  const mdPath = path.join(book.chaptersDir, `${padded}-Chapter ${chapterNum}.md`);

  if (!fs.existsSync(mdPath)) {
    console.error(`  Ch${padded} not found at ${mdPath}`);
    return null;
  }

  const raw = fs.readFileSync(mdPath, 'utf8');
  const body = raw.replace(/^#+\s+.*$/gm, '').trim();
  const title = `Chapter ${chapterNum}`;

  fs.mkdirSync(OUTBOX, { recursive: true });
  const txtPath = path.join(OUTBOX, `${book.filePrefix}_${padded}.txt`);
  fs.writeFileSync(txtPath, title + '\n\n' + body, 'utf8');

  return { bookId, num: chapterNum, title, filePath: txtPath };
}

function prepareChapters(bookId, nums) {
  return nums.map(n => prepareChapter(bookId, n)).filter(Boolean);
}

function cleanOutbox() {
  if (fs.existsSync(OUTBOX)) {
    for (const f of fs.readdirSync(OUTBOX)) {
      fs.rmSync(path.join(OUTBOX, f), { force: true });
    }
  }
}

module.exports = {
  getPublicCount,
  calculateBatch,
  getNextChapter,
  prepareChapter,
  prepareChapters,
  cleanOutbox,
};
