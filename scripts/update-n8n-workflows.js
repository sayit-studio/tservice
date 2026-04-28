const {
  repairCases,
  repairEvents,
  repairLegal,
  repairPublicEvent
} = require("./repair-n8n-workflows");

const API_BASE = "https://drwu.zeabur.app/api/v1";
const API_KEY = process.env.N8N_API_KEY;

if (!API_KEY) {
  throw new Error("N8N_API_KEY is required");
}

const TARGETS = [
  { name: "Admin Cases", repair: repairCases },
  { name: "Admin Events", repair: repairEvents },
  { name: "Admin Legal Consultation", repair: repairLegal, activeOnly: true },
  { name: "Public Event Registration", repair: repairPublicEvent }
];

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "X-N8N-API-KEY": API_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed ${response.status}: ${text}`);
  }
  return body;
}

async function updateWorkflow(summary, target) {
  const workflow = await request(`/workflows/${summary.id}`);
  const wasActive = workflow.active;
  const repaired = target.repair(workflow) || workflow;
  const payload = {
    name: repaired.name,
    nodes: repaired.nodes,
    connections: repaired.connections,
    settings: pickWritableSettings(repaired.settings || {})
  };

  await request(`/workflows/${summary.id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  if (wasActive) {
    await request(`/workflows/${summary.id}/deactivate`, { method: "POST", body: "{}" });
    await request(`/workflows/${summary.id}/activate`, { method: "POST", body: "{}" });
  }

  const updated = await request(`/workflows/${summary.id}`);
  const text = JSON.stringify(updated);
  return {
    id: updated.id,
    name: updated.name,
    active: updated.active,
    questionRuns: (text.match(/\?\?\?+/g) || []).length,
    webhooks: updated.nodes
      .filter((node) => node.type === "n8n-nodes-base.webhook")
      .map((node) => ({ path: node.parameters.path, webhookId: node.webhookId || "" })),
    notionCredentials: updated.nodes
      .filter((node) => node.type === "n8n-nodes-base.notion")
      .filter((node) => node.credentials?.notionApi).length
  };
}

function pickWritableSettings(settings) {
  const writable = {};
  [
    "executionOrder",
    "saveExecutionProgress",
    "saveManualExecutions",
    "saveDataErrorExecution",
    "saveDataSuccessExecution",
    "executionTimeout",
    "timezone",
    "errorWorkflow",
    "callerPolicy"
  ].forEach((key) => {
    if (settings[key] != null) writable[key] = settings[key];
  });
  return writable;
}

async function main() {
  const list = await request("/workflows?limit=100");
  const results = [];

  for (const target of TARGETS) {
    const matches = list.data.filter((workflow) => workflow.name === target.name);
    const selected = target.activeOnly
      ? matches.find((workflow) => workflow.active)
      : matches[0];
    if (!selected) throw new Error(`Workflow not found: ${target.name}`);
    results.push(await updateWorkflow(selected, target));
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
