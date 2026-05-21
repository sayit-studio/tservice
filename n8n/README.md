# n8n workflows

This folder contains import targets for the management backend and public legal-consultation source form.

## Workflows

| File | Webhook path | Purpose |
|---|---|---|
| `workflows/Admin Auth Staff.json` | `admin-auth-staff` | Login and staff list |
| `workflows/Admin Cases.json` | `admin-cases` | Case list/create/update |
| `workflows/Admin Events.json` | `admin-events` | Event calendar/list/create/update |
| `workflows/Admin Event Registrations.json` | `admin-event-registrations` | Event registration list/status update |
| `workflows/Admin Members.json` | `admin-members` | Member list and tag/status update |
| `workflows/Admin LINE OA Settings - Notion Nodes.json` | `admin-line-accounts` | Admin-only LINE OA settings with encrypted Token/Secret storage |
| `workflows/Admin Legal Consultation.json` | `admin-legal-consultation` | Legal consultation backend list/update |
| `workflows/Public LINE OA Members - Notion Nodes.json` | `line-oa-members` | Public LINE OA webhook for follow/message/postback member capture |
| `workflows/Public Legal Consultation.json` | `legal-consultation` | Public booking availability/book/query/cancel |
| `workflows/Public Event Registration.json` | `event-registration` | Public LINE LIFF event registration |

## Required credentials

- Notion credential with access to these databases:
  - Staff: `350b3ad1d1cd801797a7dcf6f06c7f13`
  - Cases: `29cb3ad1d1cd80da82b5fddde82ebe4d`
  - Events: `2cab3ad1d1cd804aa922caf1a7621f78`
  - Members database page: `35cb3ad1d1cd802bad62da0e74deb58f`
  - Members data source used by n8n Notion nodes: `292b3ad1d1cd8075b2d5e86e08d3d68f`
  - LINE OA settings: `35db3ad1d1cd80c28616dc1e2bc8917c`
  - Legal consultation: `2ccb3ad1d1cd8175aba6e21110f71145`
- `LINE_CONFIG_ENCRYPTION_KEY` constant in the LINE OA Code nodes for encrypting/decrypting LINE Token and Secret entered in the admin backend. The Code nodes prefer Web Crypto API and fall back to Node.js `crypto` when `NODE_FUNCTION_ALLOW_BUILTIN=crypto` is enabled.
- `Admin LINE OA Settings - Notion Nodes.json` and `Public LINE OA Members - Notion Nodes.json` use n8n Notion nodes for Notion access. Confirm each Notion node uses the `Notion-n8n` credential after import.
- `Admin LINE OA Settings - Notion Nodes.json` encrypts LINE Token/Secret before saving them to the LINE OA settings database.
- `Public LINE OA Members - Notion Nodes.json` decrypts the saved public-service token at runtime before calling LINE APIs.
- After import, fill the same random `LINE_CONFIG_ENCRYPTION_KEY` value in `Prepare LINE OA Save` and `Prepare LINE Member Upsert`.
- Do not export and commit workflow JSON after the real encryption key is filled in n8n.
- `TEAM_LINE_TARGET` environment variable or matching workflow value for internal LINE notification recipients.

## Backend config

After importing and activating the admin workflows, update `js/config.js`:

```js
window.ADMIN_CONFIG = {
  useMockData: false,
  webhookBaseUrl: "https://YOUR_N8N_DOMAIN/webhook",
  endpoints: {
    login: "/admin-auth-staff",
    casesList: "/admin-cases",
    eventsList: "/admin-events",
    membersList: "/admin-members",
    lineAccounts: "/admin-line-accounts",
    legalList: "/admin-legal-consultation",
    staffList: "/admin-auth-staff"
  }
};
```

The frontend sends an `action` value in the request body. Each workflow routes by `action`.

## Canonical workspace

Use `C:\dev\tseng-service` as the only working copy for this project. Do not import workflow files from duplicate folders.
