/**
 * Check members — runs every 6 hours
 * Detects new patrons and sends batch of 25 chapters per book
 */
const config = require('./config');
const patreonApi = require('./patreon-api');
const database = require('./database');
const chapters = require('./chapters');
const mailer = require('./mailer');

async function main() {
  console.log('=== Check New Members ===');
  console.log(`Time: ${new Date().toISOString()}`);

  const members = await patreonApi.getActiveMembers();
  console.log(`Active members: ${members.length}`);

  const newMembers = [];
  for (const member of members) {
    const known = database.getMember(member.id);
    if (!known) {
      database.addMember({
        patreonId: member.id,
        email: member.email,
        fullName: member.fullName,
        tierId: member.tierId,
        tierTitle: member.tierTitle,
        tierCents: member.tierCents,
      });
      newMembers.push(member);
    } else {
      database.updateMember(member.id, {
        tier_id: member.tierId,
        tier_title: member.tierTitle,
        tier_cents: member.tierCents,
        active: 1,
      });
    }
  }

  console.log(`New members: ${newMembers.length}`);
  if (newMembers.length === 0) {
    console.log('No new members. Done.');
    return;
  }

  for (const member of newMembers) {
    console.log(`\n  ${member.email} — books: ${member.books.join(', ') || 'none'}`);

    for (const bookId of member.books) {
      const batch = chapters.calculateBatch(bookId);
      console.log(`    ${bookId}: batch ch${batch[0]}~${batch[batch.length - 1]} (${batch.length})`);

      const files = chapters.prepareChapters(bookId, batch);
      if (files.length === 0) {
        console.log(`    ${bookId}: no chapter files found`);
        continue;
      }

      try {
        await mailer.sendChapters(member.email, member.fullName, bookId, files, 'batch');
        for (const ch of batch) {
          database.recordDelivery(member.id, bookId, ch, 'batch');
        }
        console.log(`    ${bookId}: sent ${files.length} chapters`);
      } catch (e) {
        console.error(`    ${bookId}: failed - ${e.message}`);
      }
    }
  }

  chapters.cleanOutbox();
  console.log('\nDone.');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
