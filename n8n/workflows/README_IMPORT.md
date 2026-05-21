# Workflow Import Guide

JSON filenames in this folder are aligned with the n8n workflow names shown in the n8n UI.

| File | n8n workflow name | Webhook path |
| --- | --- | --- |
| `Admin Auth Staff.json` | Admin Auth Staff | `/admin-auth-staff` |
| `Admin Cases.json` | Admin Cases | `/admin-cases` |
| `Admin Events.json` | Admin Events | `/admin-events` |
| `Admin Event Registrations.json` | Admin Event Registrations | `/admin-event-registrations` |
| `Admin Members.json` | Admin Members | `/admin-members` |
| `Admin LINE OA Settings - Notion Nodes.json` | Admin LINE OA Settings - Notion Nodes | `/admin-line-accounts` |
| `Admin Legal Consultation.json` | Admin Legal Consultation | `/admin-legal-consultation` |
| `Public LINE OA Members - Notion Nodes.json` | Public LINE OA Members - Notion Nodes | `/line-oa-members` |
| `Public Event Registration.json` | Public Event Registration | `/event-registration` |
| `Public Legal Consultation.json` | Public Legal Consultation | `/legal-consultation` |

Before importing, stop or delete older n8n workflows that use the same webhook path. n8n cannot keep two active production workflows on the same webhook path.
