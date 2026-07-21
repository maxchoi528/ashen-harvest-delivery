/**
 * Ashen Harvest — Patreon 自动章节交付系统
 * 
 * 支持环境变量 (GitHub Actions) 和本地配置
 * 
 * GitHub Secrets 需要设置:
 *   GMAIL_USER, GMAIL_PASS
 *   PATREON_CLIENT_ID, PATREON_CLIENT_SECRET
 *   PATREON_ACCESS_TOKEN, PATREON_REFRESH_TOKEN
 */

module.exports = {
  // Gmail SMTP
  gmail: {
    user: process.env.GMAIL_USER || 'cui.yujun0528@gmail.com',
    pass: process.env.GMAIL_PASS || 'lbqvjnwdcwgptxdt',
  },
  
  // Patreon API v2
  patreon: {
    clientId: process.env.PATREON_CLIENT_ID || 'xWYLxPyFy4DXjL7NymEbCtLkF0Ubb9sIYrhKMM-VoH8rdvrYzdpkMsIMyA0EGxjf',
    clientSecret: process.env.PATREON_CLIENT_SECRET || 'I_7sJ8FmKYD6k8PKjOh_AEC9det6kaFs-6EMNfR-LwSj_HgHlxha21clAiXcGmH4',
    accessToken: process.env.PATREON_ACCESS_TOKEN || '5aS7CLIoS-w9I49_LHWTuA29TPYLsp21B1KwC4FsyCo',
    refreshToken: process.env.PATREON_REFRESH_TOKEN || 'avoQZre4VKHjNZhd8dW772uGCqHxvwTa7X1LT0pmAmM',
    campaignId: null,
  },
  
  // 章节配置
  chapters: {
    // GitHub Actions: chapters checked out to repo root
    // Local: use the export directory
    dir: process.env.GITHUB_WORKSPACE 
      ? process.env.GITHUB_WORKSPACE + '/chapters'
      : 'C:/Users/bleac/AppData/Local/Temp/opencode/rr_chapters',
    total: 500,
    publicStart: 1,
    publicDate: '2026-07-22',
    aheadCount: 25,
  },
  
  // 数据库 (GitHub Actions: use /tmp)
  db: process.env.GITHUB_WORKSPACE
    ? '/tmp/patreon-ah.db'
    : 'F:/novel-writer-web/patreon-delivery-ah/patreon.db',
  
  // 小说信息
  novel: {
    title: 'Ashen Harvest',
    fromName: 'Ashen Harvest',
    filePrefix: 'Ashen_Harvest',
  },
};
