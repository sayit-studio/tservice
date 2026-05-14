# LINE OA 設定

## Notion Database

資料庫名稱：`曾辦LINEOA`

Database ID：

```text
35db3ad1d1cd80c28616dc1e2bc8917c
```

## Required Properties

| Property | Type | Notes |
|---|---|---|
| `OA 名稱` | Title | 顯示在後台的 LINE OA 名稱 |
| `設定代碼` | Rich text | 固定為 `internal-team` 或 `public-service` |
| `用途說明` | Rich text | 此 OA 負責的用途 |
| `啟用狀態` | Select | `啟用` 或 `停用` |
| `Channel ID` | Rich text | LINE Developers Channel ID |
| `Basic ID` | Rich text | LINE OA Basic ID |
| `Webhook URL` | URL | n8n webhook endpoint |
| `LIFF URL 清單` | Rich text | 一行一個 LIFF URL |
| `n8n workflow 名稱` | Rich text | 負責處理的 n8n workflow |
| `Access Token 環境變數` | Rich text | 只記錄名稱，不放 token 值 |
| `Channel Secret 環境變數` | Rich text | 只記錄名稱，不放 secret 值 |
| `備註` | Rich text | 管理備註 |
| `最後檢查時間` | Date | 最後人工檢查時間 |

## n8n Notion Nodes

這兩個 workflow 已改用 n8n 內建 Notion node，不再在 Code node 內填 Notion token：

- `workflows/admin-line-accounts.json`
- `workflows/public-line-oa-members.json`

匯入後請確認所有 Notion node 都選到同一組 Notion credential，例如 `Notion-n8n`。

## Token Handling

- Notion token：由 n8n Notion credential 管理。
- LINE public channel access token：匯入 `public-line-oa-members.json` 後，在 `Config LINE Token` Code node 填入 `LINE_PUBLIC_CHANNEL_ACCESS_TOKEN`。
- LINE channel secret：目前 workflow 尚未做簽章驗證，暫時不需要填。
- 不要把真實 token 或 secret 存進 Notion、前端檔案或匯出的 workflow JSON。

## Public LINE OA Member Mapping

對外 LINE OA webhook 寫入既有會員資料庫：

```text
35cb3ad1d1cd802bad62da0e74deb58f
```

已確認資料庫名稱為 `曾辦_民眾資料庫`。n8n Notion node 實際使用 data source ID：

```text
292b3ad1d1cd8066b50c000b82565915
```

workflow 只使用既有欄位：

| LINE / Workflow value | Notion property |
|---|---|
| LINE display name 或 userId | `會員姓名` |
| LINE userId | `LINE ID` |
| LINE display name | `LINE名稱` |
| 預設一般民眾，既有資料保留原值 | `人員屬性` |
| 文字內容判斷：法扶/活動/案件 | `互動記錄標籤` |
| webhook 事件類型、時間、最後文字訊息 | `備註` |

## Workflow Generator

若需要重建 LINE OA workflow JSON，請在 `C:\dev\tseng-service` 執行：

```powershell
node tools\generate-line-workflows.js
```
