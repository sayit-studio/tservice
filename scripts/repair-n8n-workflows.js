const fs = require("fs");

const NOTION_CREDENTIAL = {
  notionApi: {
    id: "TUc2PAbFfQKWYUgA",
    name: "Notion-n8n"
  }
};

const HELPER = `function textFromValue(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textFromValue).filter(Boolean).join('、');
  if (value.name) return String(value.name);
  if (value.plain_text) return String(value.plain_text);
  if (value.title) return textFromValue(value.title);
  if (value.rich_text) return textFromValue(value.rich_text);
  if (value.select) return textFromValue(value.select);
  if (value.status) return textFromValue(value.status);
  if (value.multi_select) return textFromValue(value.multi_select);
  if (value.relation) return (value.relation || []).map((v) => v.id).join(',');
  if (value.date) return value.date.start || '';
  if (value.phone_number) return value.phone_number || '';
  if (value.number != null) return String(value.number);
  if (value.checkbox != null) return String(value.checkbox);
  if (value.url) return String(value.url);
  return '';
}
function prop(item, names) {
  const wanted = Array.isArray(names) ? names : [names];
  for (const name of wanted) {
    if (item.json?.[name] != null) return textFromValue(item.json[name]).trim();
    const p = item.json?.properties?.[name];
    if (p != null) return textFromValue(p).trim();
  }
  const props = item.json?.properties || {};
  for (const [key, value] of Object.entries(props)) {
    if (wanted.some((name) => key.trim() === name || key.includes(name))) return textFromValue(value).trim();
  }
  return '';
}
`;

function notionNodes(workflow) {
  return workflow.nodes.filter((node) => node.type === "n8n-nodes-base.notion");
}

function setNotionCredentials(workflow) {
  notionNodes(workflow).forEach((node) => {
    node.credentials = NOTION_CREDENTIAL;
  });
}

function setWebhookId(workflow, fallbackId) {
  const webhook = workflow.nodes.find((node) => node.type === "n8n-nodes-base.webhook");
  if (webhook && !webhook.webhookId) webhook.webhookId = fallbackId;
}

function nodeByName(workflow, name) {
  const node = workflow.nodes.find((item) => item.name === name);
  if (!node) throw new Error(`Missing node: ${name}`);
  return node;
}

function setKeys(node, keys) {
  const values = node.parameters.propertiesUi?.propertyValues || [];
  keys.forEach((key, index) => {
    if (values[index]) values[index].key = key;
  });
}

function repairCases(workflow) {
  setWebhookId(workflow, "admin-cases");
  setNotionCredentials(workflow);

  nodeByName(workflow, "Normalize Cases").parameters.jsCode = `${HELPER}
return [{ json: { ok: true, data: items.map(item => ({
  id: item.json.id,
  title: prop(item, ['案件主題', '案件主題&內容', 'title', 'Name']),
  petitioner: prop(item, ['陳情人', '姓名']),
  phone: prop(item, ['陳情人電話', '電話']),
  owner: prop(item, ['負責人員']),
  ownerName: prop(item, ['負責人員']),
  status: prop(item, ['執行狀態', '狀態']),
  startDate: prop(item, ['處理起始日期', '起始日期']),
  caseNo: prop(item, ['1999案號']),
  category: prop(item, ['建議事項類別', '類別']),
  summary: prop(item, ['執行狀況敘述', '處理摘要']),
  content: prop(item, ['案件詳細說明', '陳情內容', '內容'])
})) } }];`;

  ["Create Cases", "Update Cases"].forEach((name) => {
    const node = nodeByName(workflow, name);
    if (name === "Create Cases") node.parameters.title = '={{ $json.title || $json.data.content || "未命名案件" }}';
    setKeys(node, [
      "案件主題|title",
      "陳情人|rich_text",
      "陳情人電話|phone_number",
      "負責人員|relation",
      "執行狀態|select",
      "處理起始日期|date",
      "1999案號|rich_text",
      "建議事項類別|rich_text",
      "執行狀況敘述|rich_text",
      "案件詳細說明|rich_text"
    ]);
  });
}

function repairEvents(workflow) {
  setWebhookId(workflow, "admin-events");
  setNotionCredentials(workflow);

  nodeByName(workflow, "Normalize Events").parameters.jsCode = `${HELPER}
return [{ json: { ok: true, data: items.map(item => ({
  id: item.json.id,
  title: prop(item, ['活動主題', 'title', 'Name']),
  date: prop(item, ['活動日期時間', '活動日期']),
  status: prop(item, ['活動狀態', '狀態']),
  owner: prop(item, ['負責人員']),
  ownerName: prop(item, ['負責人員']),
  community: prop(item, ['社區名稱']),
  venue: prop(item, ['活動場地']),
  expectedPeople: prop(item, ['人數預計']),
  contact: prop(item, ['活動聯絡人']),
  phone: prop(item, ['聯絡人電話']),
  registrationEnabled: prop(item, ['報名表單']),
  registrationDeadline: prop(item, ['報名截止時間']),
  registrationLimit: prop(item, ['報名名額上限']),
  registrationUrl: prop(item, ['報名表單網址']),
  registrationNote: prop(item, ['報名注意事項']),
  detail: prop(item, ['活動詳情'])
})) } }];`;

  ["Create Events", "Update Events"].forEach((name) => {
    const node = nodeByName(workflow, name);
    if (name === "Create Events") node.parameters.title = '={{ $json.title || "未命名活動" }}';
    setKeys(node, [
      "活動主題|title",
      "活動日期時間|date",
      "活動狀態|select",
      "負責人員|relation",
      "社區名稱|rich_text",
      "活動場地|rich_text",
      "人數預計|number",
      "活動聯絡人|rich_text",
      "聯絡人電話|rich_text",
      "報名表單|select",
      "報名截止時間|date",
      "報名名額上限|number",
      "報名表單網址|rich_text",
      "報名注意事項|rich_text",
      "活動詳情|rich_text"
    ]);
  });
}

function repairLegal(workflow) {
  setWebhookId(workflow, "admin-legal-consultation");
  setNotionCredentials(workflow);

  nodeByName(workflow, "Normalize Legal Consultations").parameters.jsCode = `${HELPER}
return [{ json: { ok: true, data: items.map(item => ({
  id: item.json.id,
  appointmentId: prop(item, ['預約編號']),
  name: prop(item, ['姓名']),
  phone: prop(item, ['電話']),
  appointmentDate: prop(item, ['預約日期', '預約日期時間']),
  status: prop(item, ['狀態']),
  statement: prop(item, ['事件陳述']),
  createdAt: prop(item, ['建立時間', '建立日期']),
  cancelReason: prop(item, ['取消原因']),
  cancelledAt: prop(item, ['取消時間']),
  case1999: prop(item, ['1999案號']),
  category: prop(item, ['法扶項目']),
  legalItem: prop(item, ['法扶細項']),
  legalOtherItem: prop(item, ['其它項目名稱', '其他項目名稱'])
})) } }];`;

  ["Create Legal Consultations", "Update Legal Consultations"].forEach((name) => {
    const node = nodeByName(workflow, name);
    setKeys(node, [
      "預約編號|title",
      "姓名|rich_text",
      "電話|phone_number",
      "預約日期|date",
      "狀態|select",
      "事件陳述|rich_text",
      "建立時間|date",
      "取消原因|rich_text",
      "取消時間|date",
      "1999案號|rich_text",
      "法扶項目|select",
      "法扶細項|rich_text",
      "其它項目名稱|rich_text"
    ]);
    const category = node.parameters.propertiesUi.propertyValues.find((value) => value.key === "法扶項目|select");
    if (category) category.selectValue = "={{ $json.data.category || $json.data.legalCategory }}";
    const other = node.parameters.propertiesUi.propertyValues.find((value) => value.key === "其它項目名稱|rich_text");
    if (other) other.textContent = "={{ $json.data.otherName || $json.data.legalOtherItem }}";
  });
}

function repairPublicEvent(workflow) {
  setWebhookId(workflow, "event-registration");
  setNotionCredentials(workflow);
  const serialized = JSON.stringify(workflow);
  const repaired = serialized
    .replaceAll("?曆??唳暑??隢Ⅱ隤????臬甇?Ⅱ", "找不到活動，請確認報名網址是否正確。")
    .replaceAll("瘣餃?銝駁?", "活動主題")
    .replaceAll("?勗?銵典", "報名表單")
    .replaceAll("??勗?", "開放報名")
    .replaceAll("?", "開放")
    .replaceAll("?勗??芣迫??", "報名截止時間")
    .replaceAll("?勗???銝?", "報名名額上限")
    .replaceAll("???", "狀態")
    .replaceAll("甇斗暑????勗?", "活動目前未開放報名。")
    .replaceAll("甇斗暑?歇?芣迫?勗?", "活動報名已截止。")
    .replaceAll("?典歇?勗?甇斗暑??隢???勗?", "你已完成報名，請勿重複報名。")
    .replaceAll("甇斗暑???憿歇皛?", "活動名額已滿。");
  return JSON.parse(repaired);
}

const LOCAL_REPAIRS = [
  ["n8n/workflows/REPLACE_admin-cases_CRUD_Notion_relation.json", repairCases],
  ["n8n/workflows/REPLACE_admin-events_CRUD_Notion_relation.json", repairEvents],
  ["n8n/workflows/REPLACE_admin-legal-consultation_CRUD.json", repairLegal],
  ["n8n/workflows/public-event-registration.json", repairPublicEvent]
];

function repairLocalFiles() {
  LOCAL_REPAIRS.forEach(([path, repair]) => {
    const workflow = JSON.parse(fs.readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    const repaired = repair(workflow) || workflow;
    fs.writeFileSync(path, `${JSON.stringify(repaired, null, 2)}\n`, "utf8");
  });
}

module.exports = {
  repairCases,
  repairEvents,
  repairLegal,
  repairPublicEvent,
  repairLocalFiles
};

if (require.main === module) {
  repairLocalFiles();
}
