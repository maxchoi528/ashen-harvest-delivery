# Ashen Harvest — Patreon 邮件推送系统

## 架构

```
patreon-delivery-ah/
├── config.js          # 配置 (支持环境变量 + 本地)
├── patreon-api.js     # Patreon API v2 客户端
├── database.js        # SQLite 会员/交付记录
├── chapters.js        # 章节管理 + TXT 生成
├── mailer.js          # Gmail SMTP 发送
├── check-members.js   # 每6小时: 检查新会员 → 发欢迎包
├── daily-send.js      # 每天10:00: 给会员发下一章
├── package.json
└── patreon.db         # SQLite (运行时生成)
```

## 工作流程

1. **新会员加入 Patreon** → 6小时内检测到 → 自动发送25章欢迎包到邮箱
2. **每天10:00 UTC** → 给所有活跃会员发送下一章
3. 章节以 TXT 附件形式发送

## 章节进度计算

- 公开章节 = 从发布日起每天1章
- 会员提前25章
- 例: 公开到Ch10时，会员收到Ch11~Ch35的欢迎包，之后每天+1

## GitHub Secrets 设置

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加:

| Secret Name | Value |
|-------------|-------|
| GMAIL_USER | cui.yujun0528@gmail.com |
| GMAIL_PASS | lbqvjnwdcwgptxdt |
| PATREON_CLIENT_ID | xWYLxPyFy4DXjL7NymEbCtLkF0Ubb9sIYrhKMM-VoH8rdvrYzdpkMsIMyA0EGxjf |
| PATREON_CLIENT_SECRET | I_7sJ8FmKYD6k8PKjOh_AEC9det6kaFs-6EMNfR-LwSj_HgHlxha21clAiXcGmH4 |
| PATREON_ACCESS_TOKEN | 5aS7CLIoS-w9I49_LHWTuA29TPYLsp21B1KwC4FsyCo |
| PATREON_REFRESH_TOKEN | avoQZre4VKHjNZhd8dW772uGCqHxvwTa7X1LT0pmAmM |

## 本地运行

```bash
cd F:\novel-writer-web\patreon-delivery-ah
npm install

# 手动测试
node check-members.js    # 检查新会员
node daily-send.js       # 发送今日章节
```

## GitHub Actions

文件: `.github/workflows/ashen-harvest-daily.yml`

- 每6小时: `check-members.js` (检测新会员)
- 每天10:00 UTC: `daily-send.js` (推送下一章)
- 支持手动触发 (workflow_dispatch)

## Patreon Tier 配置

复用 Maxchoi 页面现有 Tier:
- **Scarred** ($10/月): 提前25章
- **Bleeder** ($25/月): 提前50章

## 依赖

- Node.js 22+
- nodemailer (邮件发送)
- node:sqlite (内置，无需安装)
