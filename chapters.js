/**
 * 章节管理 — Ashen Harvest
 * 文件格式: NNN-Chapter N.md (从 DB 导出的格式)
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

const MANUSCRIPT_DIR = config.chapters.dir;
const TOTAL_CHAPTERS = config.chapters.total;
const AHEAD = config.chapters.aheadCount;

function getPublicChapterCount() {
  const start = new Date(config.chapters.publicDate);
  const now = new Date();
  const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.min(days + 1, TOTAL_CHAPTERS);
}

function calculateNewMemberChapters() {
  const publicCount = getPublicChapterCount();
  const batchStart = publicCount + 1;
  const batchEnd = Math.min(publicCount + AHEAD, TOTAL_CHAPTERS);
  const batch = [];
  for (let i = batchStart; i <= batchEnd; i++) batch.push(i);
  const nextDaily = batchEnd + 1 > TOTAL_CHAPTERS ? null : batchEnd + 1;
  return { batch, nextDaily, publicCount };
}

function getNextChapterForMember(lastSent) {
  const next = lastSent + 1;
  if (next > TOTAL_CHAPTERS) return null;
  return next;
}

function prepareChapter(chapterNum) {
  const padded = String(chapterNum).padStart(3, '0');
  // Ashen Harvest format: "001-Chapter 1.md"
  const mdPath = path.join(MANUSCRIPT_DIR, `${padded}-Chapter ${chapterNum}.md`);
  
  if (!fs.existsSync(mdPath)) {
    // Try alternate format
    const altPath = path.join(MANUSCRIPT_DIR, `${padded}-Chapter ${chapterNum} Chapter ${chapterNum}.md`);
    if (fs.existsSync(altPath)) {
      return prepareFromFile(altPath, chapterNum, padded);
    }
    console.error(`  Skipping ch${padded}: file not found at ${mdPath}`);
    return null;
  }
  return prepareFromFile(mdPath, chapterNum, padded);
}

function prepareFromFile(mdPath, chapterNum, padded) {
  const raw = fs.readFileSync(mdPath, 'utf8');
  const title = `Chapter ${chapterNum}`;
  const body = raw.replace(/^#+\s+.*$/gm, '').trim();
  
  const outDir = path.join(__dirname, 'outbox');
  fs.mkdirSync(outDir, { recursive: true });
  const txtPath = path.join(outDir, `${config.novel.filePrefix}_${padded}.txt`);
  fs.writeFileSync(txtPath, title + '\n\n' + body, 'utf8');
  
  return { num: chapterNum, title, filePath: txtPath };
}

function prepareChapters(nums) {
  return nums.map(n => prepareChapter(n)).filter(Boolean);
}

function cleanOutbox() {
  const outDir = path.join(__dirname, 'outbox');
  if (fs.existsSync(outDir)) {
    for (const f of fs.readdirSync(outDir)) {
      fs.rmSync(path.join(outDir, f), { force: true });
    }
  }
}

module.exports = {
  getPublicChapterCount,
  calculateNewMemberChapters,
  getNextChapterForMember,
  prepareChapter,
  prepareChapters,
  cleanOutbox,
};
