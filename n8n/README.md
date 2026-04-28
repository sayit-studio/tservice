# n8n workflows

This folder contains import targets for the management backend and public legal-consultation source form.

## Workflows

| File | Webhook path | Purpose |
|---|---|---|
| `workflows/admin-auth-staff.json` | `admin-auth-staff` | Login and staff list |
| `workflows/admin-cases.json` | `admin-cases` | Case list/create/update |
| `workflows/admin-events.json` | `admin-events` | Event calendar/list/create/update |
| `workflows/admin-legal-consultation.json` | `admin-legal-consultation` | Legal consultation backend list/update |
| `workflows/public-legal-consultation.json` | `legal-consultation` | Public booking availability/book/query/cancel |
| `workflows/public-event-registration.json` | `event-registration` | Public LINE LIFF event registration |

## Required credentials

- Notion credential with access to these databases:
  - Staff: `350b3ad1d1cd801797a7dcf6f06c7f13`
  - Cases: `29cb3ad1d1cd80da82b5fddde82ebe4d`
  - Events: `2cab3ad1d1cd804aa922caf1a7621f78`
  - Legal consultation: `2ccb3ad1d1cd8175aba6e21110f71145`
- LINE Messaging API channel access token for the public legal-consultation workflow.
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
    legalList: "/admin-legal-consultation",
    staffList: "/admin-auth-staff"
  }
};
```

The frontend sends an `action` value in the request body. Each workflow routes by `action`.
