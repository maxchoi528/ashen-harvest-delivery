/**
 * 每日推送 — 每天10:00 UTC运行
 * 给所有活跃会员发送下一章
 */
const config = require('./config');
const patreonApi = require('./patreon-api');
const database = require('./database');
const chapters = require('./chapters');
const mailer = require('./mailer');

async function main() {
  console.log('=== Ashen Harvest: Daily Send ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  // 获取当前公开章节数
  const publicCount = chapters.getPublicChapterCount();
  console.log(`Public chapters: ${publicCount}`);
  
  if (publicCount >= config.chapters.total) {
    console.log('All chapters are public. No more early access.');
    return;
  }
  
  // 获取所有活跃会员
  const members = await patreonApi.getActiveMembers();
  console.log(`Active members: ${members.length}`);
  
  if (members.length === 0) {
    console.log('No active members. Done.');
    return;
  }
  
  let sent = 0;
  let skipped = 0;
  
  for (const member of members) {
    const known = database.getMember(member.id);
    if (!known) {
      // 新会员，跳过（check-members.js 会处理）
      console.log(`  ${member.email}: new member, skipping (will get batch)`);
      skipped++;
      continue;
    }
    
    // 计算下一章
    const nextCh = chapters.getNextChapterForMember(known.last_daily_sent || known.last_batch_sent || 0);
    if (!nextCh) {
      console.log(`  ${member.email}: all chapters sent`);
      skipped++;
      continue;
    }
    
    // 准备章节
    const chFile = chapters.prepareChapter(nextCh);
    if (!chFile) {
      console.log(`  ${member.email}: chapter ${nextCh} file not found`);
      skipped++;
      continue;
    }
    
    // 发送
    try {
      await mailer.sendChapters(member.email, member.name, [chFile], 'daily');
      database.updateLastDailySent(member.id, nextCh);
      sent++;
    } catch (e) {
      console.error(`  ${member.email}: failed - ${e.message}`);
      skipped++;
    }
  }
  
  // 清理
  chapters.cleanOutbox();
  console.log(`\nSent: ${sent} | Skipped: ${skipped} | Total members: ${members.length}`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
