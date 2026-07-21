/**
 * Patreon API 客户端 (OAuth2 v2)
 * 
 * 获取会员列表 + campaign 信息
 * 参考: https://docs.patreon.com/
 */
const config = require('./config');

const API_BASE = 'https://www.patreon.com/api/oauth2/v2';
const TOKEN = config.patreon.accessToken;

let campaignId = null;

/**
 * 调用 Patreon API
 */
async function apiCall(endpoint, options = {}) {
  const url = API_BASE + endpoint;
  const headers = {
    'Authorization': 'Bearer ' + TOKEN,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Patreon API ' + res.status + ': ' + text.substring(0, 200));
  }
  return res.json();
}

/**
 * 获取 campaign ID
 */
async function getCampaignId() {
  if (campaignId) return campaignId;
  
  // 获取 campaigns 列表
  const data = await apiCall('/campaigns');
  const campaigns = data.data || [];
  
  if (campaigns.length === 0) {
    throw new Error('未找到 Patreon campaign');
  }
  
  campaignId = campaigns[0].id;
  return campaignId;
}

/**
 * 获取所有活跃付费会员
 */
async function getMembers() {
  const cId = await getCampaignId();
  
  const members = [];
  let cursor = null;
  
  do {
    let url = '/campaigns/' + cId + '/members?include=currently_entitled_tiers,user&fields[member]=patron_status,last_charge_date,last_charge_status&fields[user]=email,full_name&fields[tier]=title,amount_cents';
    if (cursor) url += '&page[cursor]=' + cursor;
    
    const data = await apiCall(url);
    
    for (const member of data.data || []) {
      if (member.attributes?.patron_status !== 'active_patron') continue;
      if (member.attributes?.last_charge_status !== 'Paid') continue;
      
      const userRel = member.relationships?.user?.data;
      const user = data.included?.find(i => i.id === userRel?.id && i.type === 'user');
      
      const tierRel = member.relationships?.currently_entitled_tiers?.data?.[0];
      const tier = data.included?.find(i => i.id === tierRel?.id && i.type === 'tier');
      
      members.push({
        id: member.id,
        email: user?.attributes?.email || '',
        fullName: user?.attributes?.full_name || '',
        tier: tier?.attributes?.title || 'Scarred',
        tierCents: tier?.attributes?.amount_cents || 1000,
      });
    }
    
    cursor = data.meta?.pagination?.cursors?.next || null;
  } while (cursor);
  
  return members;
}

module.exports = { getCampaignId, getMembers, getActiveMembers: getMembers };
