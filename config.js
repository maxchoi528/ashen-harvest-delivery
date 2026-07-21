/**
 * Multi-book Patreon delivery config
 * 
 * Books:
 *   sevenfold-bleed — The Sevenfold Bleed (RR: 167631, 200 chapters in DB, 125 on RR)
 *   ashen-harvest   — Ashen Harvest (RR: pending, 500 chapters)
 *
 * Patreon tier mapping:
 *   Sevenfold Bleed — Scarred  ($10) → tier ID 28641416
 *   Sevenfold Bleed — Bleeder  ($25) → tier ID 28641419
 *   Ashen Harvest   — Harvester ($10) → tier ID TBD (create after Patreon setup)
 *   Ashen Harvest   — Ashborn   ($25) → tier ID TBD
 */

const path = require('path');

const BOOKS = {
  'sevenfold-bleed': {
    title: 'The Sevenfold Bleed',
    filePrefix: 'Sevenfold_Bleed',
    chaptersDir: path.join(__dirname, 'chapters', 'sevenfold-bleed'),
    totalChapters: 200,
    publicCount: 125,
    aheadCount: 25,
    tierIds: ['28641416', '28641419'],
    novelId: 'sevenfold',
  },
  'ashen-harvest': {
    title: 'Ashen Harvest',
    filePrefix: 'Ashen_Harvest',
    chaptersDir: path.join(__dirname, 'chapters', 'ashen-harvest'),
    totalChapters: 500,
    publicDate: '2026-07-22',
    aheadCount: 25,
    tierIds: ['29151333', '29151338'],
    novelId: '42191fb1-f279-4bec-8a88-6ea5f8bd87ae',
  },
};

function getPublicCount(bookId) {
  const book = BOOKS[bookId];
  if (book.publicCount != null) return Math.min(book.publicCount, book.totalChapters);
  if (book.publicDate) {
    const start = new Date(book.publicDate);
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(days + 1, 0), book.totalChapters);
  }
  return 0;
}

function mapTierToBook(tierId) {
  for (const [bookId, book] of Object.entries(BOOKS)) {
    if (book.tierIds.includes(String(tierId))) return bookId;
  }
  return null;
}

module.exports = {
  BOOKS,
  getPublicCount,
  mapTierToBook,
  gmail: {
    user: process.env.GMAIL_USER || 'cui.yujun0528@gmail.com',
    pass: process.env.GMAIL_PASS || 'lbqvjnwdcwgptxdt',
  },
  patreon: {
    clientId: process.env.PATREON_CLIENT_ID || 'xWYLxPyFy4DXjL7NymEbCtLkF0Ubb9sIYrhKMM-VoH8rdvrYzdpkMsIMyA0EGxjf',
    clientSecret: process.env.PATREON_CLIENT_SECRET || 'I_7sJ8FmKYD6k8PKjOh_AEC9det6kaFs-6EMNfR-LwSj_HgHlxha21clAiXcGmH4',
    accessToken: process.env.PATREON_ACCESS_TOKEN || '5aS7CLIoS-w9I49_LHWTuA29TPYLsp21B1KwC4FsyCo',
    refreshToken: process.env.PATREON_REFRESH_TOKEN || 'avoQZre4VKHjNZhd8dW772uGCqHxvwTa7X1LT0pmAmM',
  },
  db: process.env.GITHUB_WORKSPACE
    ? '/tmp/patreon-delivery.db'
    : path.join(__dirname, 'patreon.db'),
};
