/**
 * 检查新会员 — 每6小时运行
 * 新会员 → 发送欢迎包 (当前公开数+1 ~ +25章)
 */
const config = require('./config');
const patreonApi = require('./patreon-api');
const database = require('./database');
const chapters = require('./chapters');
const mailer = require('./mailer');

async function main() {
  console.log('=== Ashen Harvest: Check Members ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  // 获取当前公开章节数
  const publicCount = chapters.getPublicChapterCount();
  console.log(`Public chapters: ${publicCount}`);
  
  // 获取 Patreon 活跃会员
  const members = await patreonApi.getActiveMembers();
  console.log(`Active members: ${members.length}`);
  
  // 检查新会员
  const newMembers = [];
  for (const member of members) {
    const known = database.getMember(member.id);
    if (!known) {
      newMembers.push(member);
      database.addMember({
        patreonId: member.id,
        email: member.email,
        fullName: member.fullName,
        tier: member.tier,
        tierCents: member.tierCents,
      });
    }
  }
  console.log(`New members: ${newMembers.length}`);
  
  if (newMembers.length === 0) {
    console.log('No new members. Done.');
    return;
  }
  
  // 计算新会员应得章节
  const { batch } = chapters.calculateNewMemberChapters();
  console.log(`Batch chapters: ${batch[0]}~${batch[batch.length - 1]} (${batch.length} chapters)`);
  
  // 准备章节文件
  const chapterFiles = chapters.prepareChapters(batch);
  console.log(`Prepared ${chapterFiles.length} chapter files`);
  
  if (chapterFiles.length === 0) {
    console.log('No chapter files found. Skipping.');
    return;
  }
  
  // 发送邮件
  for (const member of newMembers) {
    try {
      await mailer.sendChapters(member.email, member.fullName, chapterFiles, 'batch');
      database.updateLastBatchSent(member.id, batch[batch.length - 1]);
      console.log(`  Sent batch to ${member.email}`);
    } catch (e) {
      console.error(`  Failed to send to ${member.email}: ${e.message}`);
    }
  }
  
  // 清理临时文件
  chapters.cleanOutbox();
  console.log('Done.');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
