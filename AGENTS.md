# Project Context

- Canonical project workspace: `C:\dev\tseng-service`.
- Use only `C:\dev\tseng-service` for future code, n8n workflow, LIFF, and admin-console changes.
- Do not use or recreate these old/duplicate folders for this project:
  - `C:\dev\曾辦任務管理後台`
  - `C:\dev\陳情系統\tseng-service`

## Important Paths

- Admin console HTML: `C:\dev\tseng-service\zcy-staff-console-406\index.html`
- Admin console JS: `C:\dev\tseng-service\js\zcy-console.js`
- Admin API wrapper: `C:\dev\tseng-service\js\api.js`
- Admin config: `C:\dev\tseng-service\js\config.js`
- Admin CSS: `C:\dev\tseng-service\css\zcy-console.css`
- n8n workflows: `C:\dev\tseng-service\n8n\workflows`
- LIFF pages: `C:\dev\tseng-service\liff`

## LINE OA / n8n Settings

- LINE OA settings Notion database ID: `35db3ad1d1cd80c28616dc1e2bc8917c`.
- Admin LINE OA settings endpoint: `/admin-line-accounts`.
- LINE OA settings workflow: `C:\dev\tseng-service\n8n\workflows\admin-line-accounts.json`.
- Public LINE OA webhook workflow: `C:\dev\tseng-service\n8n\workflows\public-line-oa-members.json`.
- Public LINE OA webhook path currently remains `/webhook/line-oa-members`.
- Do not store real LINE channel access tokens or channel secrets in frontend files, Notion, or exported workflow JSON.
- Current Zeabur plan cannot reliably read runtime environment variables from n8n Code nodes.
- These LINE OA workflows use n8n Notion nodes for Notion access. After import, confirm every Notion node uses the `Notion-n8n` credential.
- Only `public-line-oa-members.json` needs a token in a Code node: fill `LINE_PUBLIC_CHANNEL_ACCESS_TOKEN` in `Config LINE Token`.
- If the workflow JSON needs to be regenerated, run `node tools\generate-line-workflows.js` from `C:\dev\tseng-service`.
