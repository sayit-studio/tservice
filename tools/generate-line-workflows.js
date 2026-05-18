const fs = require('fs');

const notionCred = { notionApi: { id: 'TUc2PAbFfQKWYUgA', name: 'Notion-n8n' } };
const MEMBERS_DATABASE_ID = '292b3ad1d1cd8066b50c000b82565915';
const MEMBERS_DATABASE_PAGE_ID = '35cb3ad1d1cd802bad62da0e74deb58f';

function webhook(id, name, path, position) {
  return {
    parameters: { httpMethod: 'POST', path, responseMode: 'responseNode', options: {} },
    id,
    name,
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position,
    webhookId: path
  };
}

function respond(id, name, responseBody, position, responseCode) {
  return {
    parameters: { respondWith: 'json', responseBody, options: responseCode ? { responseCode } : {} },
    id,
    name,
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.1,
    position
  };
}

function code(id, name, jsCode, position) {
  return { parameters: { jsCode }, id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position };
}

function notionGetAll(id, name, databaseId, position) {
  return {
    parameters: {
      resource: 'databasePage',
      operation: 'getAll',
      databaseId: { __rl: true, mode: 'id', value: databaseId },
      returnAll: true,
      options: {},
      simple: false
    },
    id,
    name,
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position,
    alwaysOutputData: true,
    credentials: notionCred
  };
}

function notionCreate(id, name, databaseId, title, propertyValues, position) {
  return {
    parameters: {
      resource: 'databasePage',
      databaseId: { __rl: true, mode: 'id', value: databaseId },
      title,
      propertiesUi: { propertyValues },
      options: {}
    },
    id,
    name,
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position,
    credentials: notionCred
  };
}

function notionUpdate(id, name, pageId, propertyValues, position) {
  return {
    parameters: {
      resource: 'databasePage',
      operation: 'update',
      pageId: { __rl: true, mode: 'id', value: pageId },
      propertiesUi: { propertyValues },
      options: {}
    },
    id,
    name,
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position,
    credentials: notionCred
  };
}

function switchNode(id, name, actionMap, position) {
  return {
    parameters: {
      rules: {
        values: actionMap.map(([action, outputKey]) => ({
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              { leftValue: '={{ $json.body.action }}', rightValue: action, operator: { type: 'string', operation: 'equals' } }
            ],
            combinator: 'and'
          },
          renameOutput: true,
          outputKey
        }))
      },
      options: { fallbackOutput: 'extra' }
    },
    id,
    name,
    type: 'n8n-nodes-base.switch',
    typeVersion: 3,
    position
  };
}

function ifNode(id, name, leftValue, rightValue, position) {
  return {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue, rightValue, operator: { type: 'boolean', operation: 'equals' } }],
        combinator: 'and'
      },
      options: {}
    },
    id,
    name,
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    position
  };
}

const lineAccountProps = [
  { key: 'OA名稱|title', title: '={{ $json.name }}' },
  { key: '設定代碼|rich_text', textContent: '={{ $json.key }}' },
  { key: '用途說明|rich_text', textContent: '={{ $json.purpose }}' },
  { key: '啟用狀態|select', selectValue: '={{ $json.enabledLabel }}' },
  { key: 'Channel ID|rich_text', textContent: '={{ $json.channelId }}' },
  { key: 'Basic ID|rich_text', textContent: '={{ $json.basicId }}' },
  { key: 'Webhook URL|url', urlValue: '={{ $json.webhookUrl }}' },
  { key: 'LIFF ID 清單|rich_text', textContent: '={{ $json.liffIds }}' },
  { key: 'LIFF URL清單|rich_text', textContent: '={{ $json.liffUrls }}' },
  { key: 'n8n workflow名稱|rich_text', textContent: '={{ $json.workflowName }}' },
  { key: 'Access Token環境變數|rich_text', textContent: '={{ $json.encryptedAccessToken }}' },
  { key: 'Channel Secret環境變數|rich_text', textContent: '={{ $json.encryptedChannelSecret }}' },
  { key: '備註|rich_text', textContent: '={{ $json.note }}' },
  { key: '最後檢查時間|date', includeTime: true, date: '={{ $json.lastCheckedAt || undefined }}', timezone: 'Asia/Taipei' }
];

const adminNormalizeCode = String.raw`const defaults = [
  { key: 'internal-team', name: '內部團隊 LINE OA', purpose: '同仁手機端新增/編輯資料、查看行事曆、追蹤案件進度。', enabled: 'true', channelId: '', basicId: '', webhookUrl: '', liffIds: '', liffUrls: 'https://tseng-service.pages.dev/liff/internal-team/', workflowName: 'internal-team-line-oa', accessTokenEnv: 'LINE_INTERNAL_CHANNEL_ACCESS_TOKEN', channelSecretEnv: 'LINE_INTERNAL_CHANNEL_SECRET', hasAccessToken: false, hasChannelSecret: false, note: '', lastCheckedAt: '' },
  { key: 'public-service', name: '對外民眾 LINE OA', purpose: '民眾加好友、留言、點擊 LIFF 或選單互動後取得 LINE User ID 並建立會員資料。', enabled: 'true', channelId: '', basicId: '', webhookUrl: 'https://drwu.zeabur.app/webhook/line-oa-members', liffIds: '2009640939-ACYipKCx\n2009640939-vwvDFasL', liffUrls: 'https://liff.line.me/2009640939-ACYipKCx\nhttps://liff.line.me/2009640939-vwvDFasL', workflowName: 'public-line-oa-members', accessTokenEnv: 'LINE_PUBLIC_CHANNEL_ACCESS_TOKEN', channelSecretEnv: 'LINE_PUBLIC_CHANNEL_SECRET', hasAccessToken: false, hasChannelSecret: false, note: '', lastCheckedAt: '' }
];
function text(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join('');
  if (value.name) return String(value.name);
  if (value.plain_text) return String(value.plain_text);
  if (value.title) return text(value.title);
  if (value.rich_text) return text(value.rich_text);
  if (value.select) return text(value.select);
  if (value.date) return value.date.start || '';
  if (value.url) return value.url || '';
  return '';
}
function prop(json, name) {
  const names = Array.isArray(name) ? name : [name];
  const compactNames = names.map((entry) => String(entry).replace(/\s+/g, ''));
  for (const key of names) {
    if (json[key] != null) return text(json[key]).trim();
    if (json['property_' + key] != null) return text(json['property_' + key]).trim();
    if (json.properties?.[key] != null) return text(json.properties[key]).trim();
  }
  const props = json.properties || {};
  for (const [key, value] of Object.entries({ ...json, ...props })) {
    if (compactNames.includes(String(key).replace(/\s+/g, ''))) return text(value).trim();
    if (String(key).startsWith('property_') && compactNames.includes(String(key).replace(/^property_/, '').replace(/\s+/g, ''))) return text(value).trim();
  }
  return '';
}
const saved = items.map((item) => {
  const json = item.json;
  const enabledText = prop(json, '啟用狀態');
  return {
    id: json.id,
    key: prop(json, '設定代碼'),
    name: prop(json, ['OA名稱', 'OA 名稱']),
    purpose: prop(json, '用途說明'),
    enabled: enabledText === '停用' || enabledText === 'false' ? 'false' : 'true',
    channelId: prop(json, 'Channel ID'),
    basicId: prop(json, 'Basic ID'),
    webhookUrl: prop(json, 'Webhook URL'),
    liffIds: prop(json, 'LIFF ID 清單'),
    liffUrls: prop(json, ['LIFF URL清單', 'LIFF URL 清單']),
    workflowName: prop(json, ['n8n workflow名稱', 'n8n workflow 名稱']),
    hasAccessToken: /^v[12]:/.test(prop(json, ['Access Token環境變數', 'Access Token 環境變數'])),
    hasChannelSecret: /^v[12]:/.test(prop(json, ['Channel Secret環境變數', 'Channel Secret 環境變數'])),
    accessTokenEnv: '',
    channelSecretEnv: '',
    note: prop(json, '備註'),
    lastCheckedAt: prop(json, '最後檢查時間'),
    updatedAt: json.last_edited_time || ''
  };
}).filter((item) => item.key);
const data = defaults.map((base) => {
  const item = saved.find((entry) => entry.key === base.key) || {};
  return { ...base, ...item, key: base.key, accessTokenEnv: base.accessTokenEnv, channelSecretEnv: base.channelSecretEnv };
});
return [{ json: { ok: true, data } }];`;

const adminPrepareUpdateCode = String.raw`const body = $('Admin LINE Accounts Webhook').first().json.body || {};
const data = body.data || {};
const defaults = {
  'internal-team': { key: 'internal-team', name: '內部團隊 LINE OA', purpose: '同仁手機端新增/編輯資料、查看行事曆、追蹤案件進度。', accessTokenEnv: 'LINE_INTERNAL_CHANNEL_ACCESS_TOKEN', channelSecretEnv: 'LINE_INTERNAL_CHANNEL_SECRET' },
  'public-service': { key: 'public-service', name: '對外民眾 LINE OA', purpose: '民眾加好友、留言、點擊 LIFF 或選單互動後取得 LINE User ID 並建立會員資料。', accessTokenEnv: 'LINE_PUBLIC_CHANNEL_ACCESS_TOKEN', channelSecretEnv: 'LINE_PUBLIC_CHANNEL_SECRET' }
};
const base = defaults[data.key];
if (!base) return [{ json: { ok: false, statusCode: 400, message: '只允許更新 internal-team 或 public-service。', shouldUpdate: false } }];
function text(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join('');
  if (value.name) return String(value.name);
  if (value.plain_text) return String(value.plain_text);
  if (value.title) return text(value.title);
  if (value.rich_text) return text(value.rich_text);
  if (value.select) return text(value.select);
  if (value.date) return value.date.start || '';
  if (value.url) return value.url || '';
  return '';
}
function prop(json, name) {
  const names = Array.isArray(name) ? name : [name];
  const compactNames = names.map((entry) => String(entry).replace(/\s+/g, ''));
  for (const key of names) {
    if (json[key] != null) return text(json[key]).trim();
    if (json.properties?.[key] != null) return text(json.properties[key]).trim();
  }
  const props = json.properties || {};
  for (const [key, value] of Object.entries({ ...json, ...props })) {
    if (compactNames.includes(String(key).replace(/\s+/g, ''))) return text(value).trim();
  }
  return '';
}
const LINE_CONFIG_ENCRYPTION_KEY = 'PASTE_RANDOM_ENCRYPTION_KEY_HERE';
function hasWebCrypto() {
  return Boolean(globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
}
function nodeCrypto() {
  try {
    return require('crypto');
  } catch (_) {
    return null;
  }
}
function secretText() {
  const secret = String(LINE_CONFIG_ENCRYPTION_KEY || '').trim();
  if (!secret || secret.includes('PASTE_')) throw new Error('請先在 Prepare LINE OA Save 節點填入 LINE_CONFIG_ENCRYPTION_KEY。');
  return secret;
}
async function encryptionKey(usages) {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(secretText()));
  return globalThis.crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, usages);
}
function base64(bytes) {
  return Buffer.from(bytes).toString('base64');
}
async function encryptSecret(value) {
  const plain = String(value || '').trim();
  if (!plain) return '';
  if (hasWebCrypto()) {
    const iv = new Uint8Array(12);
    globalThis.crypto.getRandomValues(iv);
    const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(['encrypt']), new TextEncoder().encode(plain));
    return ['v2', base64(iv), base64(new Uint8Array(encrypted))].join(':');
  }
  const crypto = nodeCrypto();
  if (!crypto) throw new Error('此 n8n 環境不支援 Web Crypto API；請在 n8n 環境變數加入 NODE_FUNCTION_ALLOW_BUILTIN=crypto 後重啟。');
  const key = crypto.createHash('sha256').update(secretText()).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final(), cipher.getAuthTag()]);
  return ['v2', iv.toString('base64'), encrypted.toString('base64')].join(':');
}
const existing = $('Query LINE OA Settings For Update').all().find((item) => prop(item.json, '設定代碼') === base.key);
const existingAccessToken = existing ? prop(existing.json, ['Access Token環境變數', 'Access Token 環境變數']) : '';
const existingChannelSecret = existing ? prop(existing.json, ['Channel Secret環境變數', 'Channel Secret 環境變數']) : '';
const incomingAccessToken = String(data.channelAccessToken || '').trim();
const incomingChannelSecret = String(data.channelSecret || '').trim();
let encryptedAccessToken = existingAccessToken;
let encryptedChannelSecret = existingChannelSecret;
try {
  if (incomingAccessToken) encryptedAccessToken = await encryptSecret(incomingAccessToken);
  if (incomingChannelSecret) encryptedChannelSecret = await encryptSecret(incomingChannelSecret);
} catch (error) {
  return [{ json: { ok: false, statusCode: 500, message: error.message, shouldUpdate: false } }];
}
const payload = {
  ...base,
  name: String(data.name || base.name).trim(),
  purpose: String(data.purpose || base.purpose).trim(),
  enabled: String(data.enabled) === 'false' ? 'false' : 'true',
  enabledLabel: String(data.enabled) === 'false' ? '停用' : '啟用',
  channelId: String(data.channelId || '').trim(),
  basicId: String(data.basicId || '').trim(),
  webhookUrl: String(data.webhookUrl || '').trim(),
  liffIds: Array.isArray(data.liffIds) ? data.liffIds.join('\n') : String(data.liffIds || '').trim(),
  liffUrls: Array.isArray(data.liffUrls) ? data.liffUrls.join('\n') : String(data.liffUrls || '').trim(),
  workflowName: String(data.workflowName || '').trim(),
  encryptedAccessToken,
  encryptedChannelSecret,
  hasAccessToken: Boolean(encryptedAccessToken),
  hasChannelSecret: Boolean(encryptedChannelSecret),
  note: String(data.note || '').trim(),
  lastCheckedAt: String(data.lastCheckedAt || '').trim(),
  pageId: existing?.json?.id || '',
  shouldUpdate: Boolean(existing?.json?.id)
};
return [{ json: payload }];`;

const publicPrepareCode = String.raw`const body = $('LINE OA Members Webhook').first().json.body || {};
const events = Array.isArray(body.events) ? body.events : [];
const bindData = body.action === 'member.bind' || body.source === 'line-liff' ? (body.data || {}) : null;
function text(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join('、');
  if (value.name) return String(value.name);
  if (value.plain_text) return String(value.plain_text);
  if (value.title) return text(value.title);
  if (value.rich_text) return text(value.rich_text);
  if (value.select) return text(value.select);
  if (value.multi_select) return text(value.multi_select);
  if (value.date) return value.date.start || '';
  if (value.url) return value.url || '';
  if (value.phone_number) return value.phone_number || '';
  return '';
}
function prop(json, name) {
  const names = Array.isArray(name) ? name : [name];
  const compactNames = names.map((entry) => String(entry).replace(/\s+/g, ''));
  for (const key of names) {
    if (json[key] != null) return text(json[key]).trim();
    if (json.properties?.[key] != null) return text(json.properties[key]).trim();
  }
  const props = json.properties || {};
  for (const [key, value] of Object.entries({ ...json, ...props })) {
    if (compactNames.includes(String(key).replace(/\s+/g, ''))) return text(value).trim();
  }
  return '';
}
const LINE_CONFIG_ENCRYPTION_KEY = 'PASTE_RANDOM_ENCRYPTION_KEY_HERE';
function hasWebCrypto() {
  return Boolean(globalThis.crypto?.subtle);
}
function nodeCrypto() {
  try {
    return require('crypto');
  } catch (_) {
    return null;
  }
}
function secretText() {
  const secret = String(LINE_CONFIG_ENCRYPTION_KEY || '').trim();
  if (!secret || secret.includes('PASTE_')) return '';
  return secret;
}
async function encryptionKey() {
  const secret = secretText();
  if (!secret || !hasWebCrypto()) return null;
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return globalThis.crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['decrypt']);
}
async function decryptSecret(value) {
  const encrypted = String(value || '').trim();
  if (!encrypted) return '';
  const parts = encrypted.split(':');
  if (parts.length === 3 && parts[0] === 'v2') {
    if (hasWebCrypto()) {
      const key = await encryptionKey();
      if (!key) return '';
      const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(parts[1], 'base64') }, key, Buffer.from(parts[2], 'base64'));
      return new TextDecoder().decode(decrypted);
    }
    const crypto = nodeCrypto();
    const secret = secretText();
    if (!crypto || !secret) return '';
    const key = crypto.createHash('sha256').update(secret).digest();
    const payload = Buffer.from(parts[2], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[1], 'base64'));
    decipher.setAuthTag(payload.subarray(payload.length - 16));
    return Buffer.concat([decipher.update(payload.subarray(0, payload.length - 16)), decipher.final()]).toString('utf8');
  }
  if (parts.length === 4 && parts[0] === 'v1') {
    const crypto = nodeCrypto();
    const secret = secretText();
    if (!crypto || !secret) return '';
    const key = crypto.createHash('sha256').update(secret).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[1], 'base64'));
    decipher.setAuthTag(Buffer.from(parts[2], 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(parts[3], 'base64')), decipher.final()]).toString('utf8');
  }
  return '';
}
function splitTags(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '').split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
}
function mergeTags(existingTags, incomingTags) {
  return Array.from(new Set([...splitTags(existingTags), ...splitTags(incomingTags)])).join(',');
}
function eventTags(event, existingTags) {
  const tags = splitTags(existingTags);
  if (event.type === 'follow') tags.push('已加好友');
  if (event.type === 'message') tags.push('曾傳訊息');
  if (event.type === 'postback') tags.push('曾點選選單');
  const msg = event.message?.type === 'text' ? String(event.message.text || '') : '';
  if (msg.includes('法扶') || msg.includes('法律')) tags.push('115年法扶');
  if (msg.includes('活動') || msg.includes('報名')) tags.push('115年活動');
  if (msg.includes('陳情') || msg.includes('案件')) tags.push('115年案件');
  return mergeTags('', tags);
}
function noteLine(source, detail, at) {
  return [source, at || new Date().toISOString(), detail].filter(Boolean).join(' / ');
}
function appendNote(oldNote, line) {
  return [String(oldNote || '').trim(), line].filter(Boolean).join('\n');
}
function memberTags(existing) {
  return existing ? prop(existing.json, '標籤') || prop(existing.json, '互動記錄標籤') : '';
}
function memberNote(existing) {
  return existing ? prop(existing.json, '備註') : '';
}
function memberPhone(existing) {
  return existing ? prop(existing.json, '行動電話') || prop(existing.json, '電話') || prop(existing.json, '手機') : '';
}
function memberName(existing) {
  return existing ? prop(existing.json, '會員姓名') || prop(existing.json, '姓名') || prop(existing.json, 'Name') : '';
}
function memberAttribute(existing) {
  return existing ? prop(existing.json, '人員屬性') || '一般民眾' : '一般民眾';
}
const lineSettings = $('Query LINE OA Settings For Token').all();
const publicSetting = lineSettings.find((item) => prop(item.json, '設定代碼') === 'public-service');
const token = publicSetting ? await decryptSecret(prop(publicSetting.json, ['Access Token環境變數', 'Access Token 環境變數'])) : '';
async function profile(userId) {
  if (!token) return { userId };
  try {
    return await this.helpers.httpRequest({ method: 'GET', url: 'https://api.line.me/v2/bot/profile/' + encodeURIComponent(userId), headers: { Authorization: 'Bearer ' + token }, json: true });
  } catch (_) {
    return { userId };
  }
}
const members = $('Query Members').all();
const out = [];
if (bindData) {
  const userId = String(bindData.lineUserId || bindData.userId || '').trim();
  if (userId) {
    const existing = members.find((item) => prop(item.json, 'LINE User ID') === userId || prop(item.json, 'LINE ID') === userId);
    const at = body.submittedAt || bindData.submittedAt || new Date().toISOString();
    const stage = String(bindData.stage || 'liff_use').trim();
    const detail = [stage, bindData.sourcePage, bindData.name, bindData.phone].filter(Boolean).join(' / ');
    out.push({
      pageId: existing?.json?.id || '',
      shouldUpdate: Boolean(existing?.json?.id),
      memberName: String(bindData.name || bindData.displayName || '').trim() || memberName(existing) || userId,
      phone: String(bindData.phone || '').trim() || memberPhone(existing),
      lineUserId: userId,
      lineDisplayName: String(bindData.displayName || '').trim() || prop(existing?.json || {}, 'LINE名稱') || prop(existing?.json || {}, 'LINE 名稱'),
      tags: mergeTags(memberTags(existing), bindData.tags || ['LIFF 綁定']),
      attribute: memberAttribute(existing),
      note: appendNote(memberNote(existing), noteLine('LIFF member.bind', detail, at)),
      eventType: stage
    });
  }
}
if (events.length && !token) {
  return [{ json: { ok: false, statusCode: 500, message: '請先在 LINE OA 設定填入 Channel Access Token，並確認 Prepare LINE Member Upsert 節點已填入 LINE_CONFIG_ENCRYPTION_KEY。', noOperation: true, shouldUpdate: false } }];
}
for (const event of events) {
  const userId = event.source?.userId;
  if (!userId) continue;
  const existing = members.find((item) => prop(item.json, 'LINE User ID') === userId || prop(item.json, 'LINE ID') === userId);
  const p = await profile(userId);
  const now = event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString();
  const message = event.message?.type === 'text' ? String(event.message.text || '').trim() : '';
  out.push({
    pageId: existing?.json?.id || '',
    shouldUpdate: Boolean(existing?.json?.id),
    memberName: p.displayName || memberName(existing) || userId,
    phone: memberPhone(existing),
    lineUserId: userId,
    lineDisplayName: p.displayName || '',
    pictureUrl: p.pictureUrl || '',
    statusMessage: p.statusMessage || '',
    tags: eventTags(event, memberTags(existing)),
    attribute: memberAttribute(existing),
    note: appendNote(memberNote(existing), noteLine('LINE OA ' + event.type, message, now)),
    joinedAt: event.type === 'follow' && !existing ? now : '',
    lastInteractionAt: now,
    lastMessage: message,
    eventType: event.type
  });
}
if (!out.length) return [{ json: { ok: true, processed: 0, message: 'No LINE member data to process.', noOperation: true, shouldUpdate: false } }];
return out.map((json) => ({ json }));`;

const memberProps = [
  { key: '會員姓名|title', title: '={{ $json.memberName }}' },
  { key: '行動電話|phone_number', phoneValue: '={{ $json.phone }}' },
  { key: 'LINE ID|rich_text', textContent: '={{ $json.lineUserId }}' },
  { key: 'LINE名稱|rich_text', textContent: '={{ $json.lineDisplayName }}' },
  { key: '人員屬性|select', selectValue: '={{ $json.attribute }}' },
  { key: '互動記錄標籤|multi_select', multiSelectValue: '={{ $json.tags }}' },
  { key: '備註|rich_text', textContent: '={{ $json.note }}' }
];

const adminWorkflow = {
  name: 'Admin LINE OA Settings - Notion Nodes',
  nodes: [
    webhook('admin-line-accounts-webhook', 'Admin LINE Accounts Webhook', 'admin-line-accounts', [-900, 0]),
    switchNode('admin-line-accounts-route', 'Route Action', [['lineAccounts.list', 'list'], ['lineAccounts.update', 'update']], [-680, 0]),
    notionGetAll('admin-line-accounts-query-list', 'Query LINE OA Settings', '35db3ad1d1cd80c28616dc1e2bc8917c', [-440, -160]),
    code('admin-line-accounts-normalize', 'Normalize LINE OA Settings', adminNormalizeCode, [-200, -160]),
    respond('admin-line-accounts-list-response', 'Respond LINE OA List', '={{ $json }}', [40, -160]),
    notionGetAll('admin-line-accounts-query-update', 'Query LINE OA Settings For Update', '35db3ad1d1cd80c28616dc1e2bc8917c', [-440, 120]),
    code('admin-line-accounts-prepare-update', 'Prepare LINE OA Save', adminPrepareUpdateCode, [-200, 120]),
    ifNode('admin-line-accounts-if-valid-save', 'Is Valid LINE OA Save', '={{ $json.ok !== false }}', true, [40, 120]),
    ifNode('admin-line-accounts-if-existing', 'Has Existing LINE OA Page', '={{ $json.shouldUpdate }}', true, [280, 80]),
    notionUpdate('admin-line-accounts-update-page', 'Update LINE OA Setting', '={{ $json.pageId }}', lineAccountProps, [520, -20]),
    notionCreate('admin-line-accounts-create-page', 'Create LINE OA Setting', '35db3ad1d1cd80c28616dc1e2bc8917c', '={{ $json.name }}', lineAccountProps, [520, 180]),
    respond('admin-line-accounts-save-response', 'Respond LINE OA Save', '={{ $json.ok === false ? $json : { ok: true, data: { saved: true } } }}', [760, 120], '={{ $json.statusCode || 200 }}'),
    respond('admin-line-accounts-fallback', 'Respond Unsupported', '={{ { ok: false, message: "Unsupported action" } }}', [-440, 340], 400)
  ],
  pinData: {},
  connections: {
    'Admin LINE Accounts Webhook': { main: [[{ node: 'Route Action', type: 'main', index: 0 }]] },
    'Route Action': { main: [[{ node: 'Query LINE OA Settings', type: 'main', index: 0 }], [{ node: 'Query LINE OA Settings For Update', type: 'main', index: 0 }], [{ node: 'Respond Unsupported', type: 'main', index: 0 }]] },
    'Query LINE OA Settings': { main: [[{ node: 'Normalize LINE OA Settings', type: 'main', index: 0 }]] },
    'Normalize LINE OA Settings': { main: [[{ node: 'Respond LINE OA List', type: 'main', index: 0 }]] },
    'Query LINE OA Settings For Update': { main: [[{ node: 'Prepare LINE OA Save', type: 'main', index: 0 }]] },
    'Prepare LINE OA Save': { main: [[{ node: 'Is Valid LINE OA Save', type: 'main', index: 0 }]] },
    'Is Valid LINE OA Save': { main: [[{ node: 'Has Existing LINE OA Page', type: 'main', index: 0 }], [{ node: 'Respond LINE OA Save', type: 'main', index: 0 }]] },
    'Has Existing LINE OA Page': { main: [[{ node: 'Update LINE OA Setting', type: 'main', index: 0 }], [{ node: 'Create LINE OA Setting', type: 'main', index: 0 }]] },
    'Update LINE OA Setting': { main: [[{ node: 'Respond LINE OA Save', type: 'main', index: 0 }]] },
    'Create LINE OA Setting': { main: [[{ node: 'Respond LINE OA Save', type: 'main', index: 0 }]] }
  },
  active: false,
  settings: { executionOrder: 'v1' },
  versionId: 'admin-line-accounts-notion-nodes-v2',
  meta: { templateCredsSetupCompleted: false },
  id: 'admin-line-accounts',
  tags: []
};

const publicWorkflow = {
  name: 'Public LINE OA Members - Notion Nodes',
  nodes: [
    webhook('line-oa-members-webhook', 'LINE OA Members Webhook', 'line-oa-members', [-980, 0]),
    notionGetAll('line-oa-members-line-settings', 'Query LINE OA Settings For Token', '35db3ad1d1cd80c28616dc1e2bc8917c', [-760, 0]),
    notionGetAll('line-oa-members-query', 'Query Members', MEMBERS_DATABASE_ID, [-540, 0]),
    code('line-oa-members-prepare', 'Prepare LINE Member Upsert', publicPrepareCode, [-300, 0]),
    ifNode('line-oa-members-if-noop', 'Is No Operation', '={{ $json.noOperation === true }}', true, [-60, 0]),
    ifNode('line-oa-members-if-existing', 'Has Existing Member', '={{ $json.shouldUpdate }}', true, [180, 80]),
    notionUpdate('line-oa-members-update', 'Update Member', '={{ $json.pageId }}', memberProps, [420, -20]),
    notionCreate('line-oa-members-create', 'Create Member', MEMBERS_DATABASE_ID, '={{ $json.memberName }}', memberProps, [420, 180]),
    respond('line-oa-members-response', 'Respond LINE', '={{ $json.ok === false || $json.noOperation ? $json : { ok: true, processed: 1, action: "saved" } }}', [680, 80], '={{ $json.statusCode || 200 }}')
  ],
  pinData: {},
  connections: {
    'LINE OA Members Webhook': { main: [[{ node: 'Query LINE OA Settings For Token', type: 'main', index: 0 }]] },
    'Query LINE OA Settings For Token': { main: [[{ node: 'Query Members', type: 'main', index: 0 }]] },
    'Query Members': { main: [[{ node: 'Prepare LINE Member Upsert', type: 'main', index: 0 }]] },
    'Prepare LINE Member Upsert': { main: [[{ node: 'Is No Operation', type: 'main', index: 0 }]] },
    'Is No Operation': { main: [[{ node: 'Respond LINE', type: 'main', index: 0 }], [{ node: 'Has Existing Member', type: 'main', index: 0 }]] },
    'Has Existing Member': { main: [[{ node: 'Update Member', type: 'main', index: 0 }], [{ node: 'Create Member', type: 'main', index: 0 }]] },
    'Update Member': { main: [[{ node: 'Respond LINE', type: 'main', index: 0 }]] },
    'Create Member': { main: [[{ node: 'Respond LINE', type: 'main', index: 0 }]] }
  },
  active: false,
  settings: { executionOrder: 'v1' },
  versionId: 'public-line-oa-members-notion-nodes-v2',
  meta: { templateCredsSetupCompleted: false },
  id: 'public-line-oa-members',
  tags: []
};

fs.writeFileSync('n8n/workflows/admin-line-accounts.json', JSON.stringify(adminWorkflow, null, 2) + '\n', 'utf8');
fs.writeFileSync('n8n/workflows/public-line-oa-members.json', JSON.stringify(publicWorkflow, null, 2) + '\n', 'utf8');
