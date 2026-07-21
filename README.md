# Novel Delivery System

Automated chapter delivery for Patreon patrons via email.

## Books

| Book | Royal Road | Chapters | Public | Ahead |
|------|-----------|----------|--------|------|
| The Sevenfold Bleed | [167631](https://www.royalroad.com/fiction/167631) | 200 | 125 | 25 |
| Ashen Harvest | Pending | 500 | 0 | 25 |

## How it works

- **check-members.js** — Runs every 6 hours. Detects new patrons, sends batch of 25 early chapters per book.
- **daily-send.js** — Runs daily at 10:00 UTC. Sends one new chapter per book to each patron.

## Patreon Tiers

| Tier | Price | Book |
|------|-------|------|
| Sevenfold Bleed — Scarred | $10 | The Sevenfold Bleed |
| Sevenfold Bleed — Bleeder | $25 | The Sevenfold Bleed |
| Ashen Harvest — Harvester | $10 | Ashen Harvest |
| Ashen Harvest — Ashborn | $25 | Ashen Harvest |

Both tiers ($10 and $25) deliver the same 25 chapters ahead. The $25 tier exists for readers who want to support more.
