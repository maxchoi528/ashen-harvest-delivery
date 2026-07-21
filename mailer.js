/**
 * Email sender — multi-book
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

async function sendChapters(to, name, bookId, chapters, type) {
  const transport = getTransporter();
  const book = config.BOOKS[bookId];
  const isBatch = type === 'batch';

  const subject = isBatch
    ? `Welcome to ${book.title}! Your ${chapters.length} early chapters are here`
    : `${book.title} — New Chapter: ${chapters[0].title}`;

  const intro = isBatch
    ? `Hi ${name},\n\nWelcome to the ${book.title} Patreon! Here are your ${chapters.length} early chapters.\n\nThese are ahead of the public release on Royal Road. Enjoy!`
    : `Hi ${name},\n\nHere's the next early chapter of ${book.title}.\n\nThank you for your continued support!`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #2c3e50;">${book.title} — ${isBatch ? 'Welcome!' : 'New Chapter'}</h2>
      <p>${intro.replace(/\n/g, '<br>')}</p>
      <hr style="border: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">
        You're receiving this because you're a patron of ${book.title}.<br>
        To unsubscribe, reply to this email.
      </p>
    </div>
  `;

  const attachments = chapters.map(ch => ({
    filename: `${book.filePrefix}_${String(ch.num).padStart(3, '0')}.txt`,
    path: ch.filePath,
  }));

  await transport.sendMail({
    from: `"${book.title}" <${config.gmail.user}>`,
    to, subject, text: intro, html, attachments,
  });

  console.log(`  ✅ ${to}: ${chapters.length} chapter(s) [${bookId}]`);
}

module.exports = { sendChapters };
