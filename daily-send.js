/**
 * Daily send — runs at 10:00 UTC
 * Sends one new chapter per book to each active member
 */
const config = require('./config');
const patreonApi = require('./patreon-api');
const database = require('./database');
const chapters = require('./chapters');
const mailer = require('./mailer');

async function main() {
  console.log('=== Daily Chapter Delivery ===');
  console.log(`Time: ${new Date().toISOString()}`);

  const members = await patreonApi.getActiveMembers();
  console.log(`Active members: ${members.length}`);

  if (members.length === 0) {
    console.log('No active members. Done.');
    return;
  }

  let sent = 0;
  let skipped = 0;

  for (const member of members) {
    console.log(`\n  ${member.email} (${member.fullName}) — books: ${member.books.join(', ') || 'none'}`);

    for (const bookId of member.books) {
      const book = config.BOOKS[bookId];
      const lastSent = database.getLastSentChapter(member.id, bookId);
      const nextCh = chapters.getNextChapter(bookId, lastSent);

      if (!nextCh) {
        console.log(`    ${bookId}: all chapters sent`);
        skipped++;
        continue;
      }

      if (database.wasChapterSent(member.id, bookId, nextCh)) {
        console.log(`    ${bookId}: ch${nextCh} already sent, trying next`);
        skipped++;
        continue;
      }

      const chFile = chapters.prepareChapter(bookId, nextCh);
      if (!chFile) {
        console.log(`    ${bookId}: ch${nextCh} file not found`);
        skipped++;
        continue;
      }

      try {
        await mailer.sendChapters(member.email, member.fullName, bookId, [chFile], 'daily');
        database.recordDelivery(member.id, bookId, nextCh, 'daily');
        sent++;
      } catch (e) {
        console.error(`    ${bookId}: failed - ${e.message}`);
        skipped++;
      }
    }
  }

  chapters.cleanOutbox();
  console.log(`\nSent: ${sent} | Skipped: ${skipped} | Members: ${members.length}`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
