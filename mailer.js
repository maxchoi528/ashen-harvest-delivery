/**
 * 邮件发送 — Ashen Harvest
 */
const nodemailer = require('nodemailer');
const config = require('./config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: config.gmail.user, pass: config.gmail.pass },
  });
  return transporter;
}

async function sendChapters(to, name, chapters, type) {
  const transport = getTransporter();
  const isBatch = type === 'batch';
  const novelTitle = config.novel.title;
  const filePrefix = config.novel.filePrefix;
  
  const subject = isBatch
    ? `Welcome to ${novelTitle}! Your ${chapters.length} early chapters are here`
    : `${novelTitle} — New Chapter: ${chapters[0].title}`;
  
  const intro = isBatch
    ? `Hi ${name},\n\nWelcome to the ${novelTitle} Patreon! Here are your ${chapters.length} early chapters.\n\nThese are ahead of the public release on Royal Road. Enjoy!`
    : `Hi ${name},\n\nHere's the next early chapter of ${novelTitle}.\n\nThank you for your continued support!`;
  
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #2c3e50;">${novelTitle} — ${isBatch ? 'Welcome!' : 'New Chapter'}</h2>
      <p>${intro.replace(/\n/g, '<br>')}</p>
      <hr style="border: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">
        You're receiving this because you're a patron of ${novelTitle}.<br>
        To unsubscribe, reply to this email.
      </p>
    </div>
  `;
  
  const attachments = chapters.map(ch => ({
    filename: `${filePrefix}_${String(ch.num).padStart(3, '0')}.txt`,
    path: ch.filePath,
  }));
  
  await transport.sendMail({
    from: `"${config.novel.fromName}" <${config.gmail.user}>`,
    to, subject, text: intro, html, attachments,
  });
  
  console.log(`  ✅ Email sent to ${to}: ${chapters.length} chapter(s)`);
}

module.exports = { sendChapters };
