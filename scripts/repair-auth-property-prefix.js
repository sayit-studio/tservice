const fs = require("fs");

const path = "n8n/workflows/REPLACE_admin-auth-staff_CRUD.json";
const workflow = JSON.parse(fs.readFileSync(path, "utf8"));

const oldBlock = `  for (const name of wanted) {
    if (item.json[name] != null) return textFromValue(item.json[name]).trim();
    const p = item.json.properties?.[name];
    if (p != null) return textFromValue(p).trim();
  }`;

const newBlock = `  for (const name of wanted) {
    const directKeys = [name, "property_" + name];
    for (const key of directKeys) {
      if (item.json[key] != null) return textFromValue(item.json[key]).trim();
    }
    const p = item.json.properties?.[name];
    if (p != null) return textFromValue(p).trim();
  }`;

let replaced = 0;
for (const node of workflow.nodes.filter((item) => [
  "Validate Login",
  "Normalize Staff List",
  "Build Staff Debug"
].includes(item.name))) {
  if (node.parameters.jsCode.includes(oldBlock)) {
    node.parameters.jsCode = node.parameters.jsCode.replace(oldBlock, newBlock);
    replaced += 1;
  }
}

if (replaced !== 3) {
  throw new Error(`Expected 3 replacements, got ${replaced}`);
}

fs.writeFileSync(path, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
console.log(`Updated ${replaced} auth code nodes`);
