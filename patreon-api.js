/**
 * Patreon API client — multi-book tier mapping
 */
const config = require('./config');

const API_BASE = 'https://www.patreon.com/api/oauth2/v2';
const TOKEN = config.patreon.accessToken;
let campaignId = null;

async function apiCall(endpoint) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { Authorization: 'Bearer ' + TOKEN },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Patreon API ' + res.status + ': ' + text.substring(0, 300));
  }
  return res.json();
}

async function getCampaignId() {
  if (campaignId) return campaignId;
  const data = await apiCall('/campaigns');
  campaignId = data.data[0].id;
  return campaignId;
}

/**
 * Get all active members with their tier info mapped to books
 */
async function getActiveMembers() {
  const cId = await getCampaignId();
  const members = [];
  let cursor = null;

  do {
    let url = `/campaigns/${cId}/members?include=currently_entitled_tiers,user&fields[member]=patron_status,last_charge_status&fields[user]=email,full_name&fields[tier]=title,amount_cents`;
    if (cursor) url += '&page[cursor]=' + cursor;
    const data = await apiCall(url);

    for (const member of data.data || []) {
      if (member.attributes?.patron_status !== 'active_patron') continue;
      if (member.attributes?.last_charge_status !== 'Paid') continue;

      const userRel = member.relationships?.user?.data;
      const user = data.included?.find(i => i.id === userRel?.id && i.type === 'user');

      const tierRels = member.relationships?.currently_entitled_tiers?.data || [];
      const tiers = tierRels.map(tr => {
        const tier = data.included?.find(i => i.id === tr.id && i.type === 'tier');
        return {
          id: tr.id,
          title: tier?.attributes?.title || '',
          amountCents: tier?.attributes?.amount_cents || 0,
        };
      });

      const tier = tiers[0] || { id: '', title: '', amountCents: 0 };

      const books = [];
      for (const t of tiers) {
        const bookId = config.mapTierToBook(t.id);
        if (bookId && !books.includes(bookId)) books.push(bookId);
      }

      members.push({
        id: member.id,
        email: user?.attributes?.email || '',
        fullName: user?.attributes?.full_name || '',
        tierId: tier.id,
        tierTitle: tier.title,
        tierCents: tier.amountCents,
        books,
      });
    }
    cursor = data.meta?.pagination?.cursors?.next || null;
  } while (cursor);

  return members;
}

module.exports = { getCampaignId, getActiveMembers };
