# LINE OA 設定

## 目標

後台的 `LINE OA 設定` 讓客戶自行填入 LINE Developers 需要的資料。`Channel Access Token` 與 `Channel Secret` 只在輸入當下出現，送出後不回顯明碼，也不在 API response 裡回傳。

目前已關聯的公開 LIFF：

| 用途 | LIFF ID | LIFF URL | Webhook |
|---|---|---|---|
| 活動報名 | `2009640939-ACYipKCx` | `https://liff.line.me/2009640939-ACYipKCx` | `https://drwu.zeabur.app/webhook/event-registration` |
| 法律諮詢 | `2009640939-vwvDFasL` | `https://liff.line.me/2009640939-vwvDFasL` | `https://drwu.zeabur.app/webhook/legal-consultation` |

兩個 LIFF 都會另外呼叫 `https://drwu.zeabur.app/webhook/line-oa-members`，把 LINE User ID 與互動來源寫入會員資料庫。

## Notion Database

LINE OA 設定資料庫：

```text
35db3ad1d1cd80c28616dc1e2bc8917c
```

## Required Properties

| Property | Type | Notes |
|---|---|---|
| `OA 名稱` | Title | 後台顯示名稱 |
| `設定代碼` | Rich text | 固定使用 `internal-team` 或 `public-service` |
| `用途說明` | Rich text | OA 使用目的 |
| `啟用狀態` | Select | `啟用` 或 `停用` |
| `Channel ID` | Rich text | LINE Developers Channel ID |
| `Basic ID` | Rich text | LINE OA Basic ID，例如 `@xxxxxxx` |
| `Webhook URL` | URL | n8n webhook endpoint |
| `LIFF ID 清單` | Rich text | 一行一個 LIFF ID |
| `LIFF URL 清單` | Rich text | 一行一個 LIFF URL |
| `n8n workflow 名稱` | Rich text | 對應 n8n workflow |
| `Access Token 環境變數` | Rich text | 目前改存加密後的 Channel Access Token，不存明碼 |
| `Channel Secret 環境變數` | Rich text | 目前改存加密後的 Channel Secret，不存明碼 |
| `備註` | Rich text | 管理註記 |
| `最後檢查時間` | Date | 人工檢查時間 |

## Secret Handling

- 後台表單可輸入 `Channel Access Token` 與 `Channel Secret`。
- 輸入欄位是 password，不提供再次確認或顯示明碼。
- 欄位留空代表保留原本加密值。
- `admin-line-accounts.json` 使用 `LINE_CONFIG_ENCRYPTION_KEY` 將 Token/Secret 加密後寫入 Notion。
- `public-line-oa-members.json` 讀取 `public-service` 設定並用同一把 `LINE_CONFIG_ENCRYPTION_KEY` 解密 Token，再呼叫 LINE profile API。
- 儲存後後台 list API 只回傳 `hasAccessToken` / `hasChannelSecret`，不回傳明碼或加密值。
- n8n Code node 需要可使用 Node.js `crypto` builtin；若環境限制 require builtin，需在 n8n 環境允許 `crypto`。

部署時需在 n8n/Zeabur 設定：

```text
LINE_CONFIG_ENCRYPTION_KEY=<至少32字元的隨機字串>
```

## Public LINE OA Member Mapping

對外 LINE OA webhook 寫入既有會員資料庫：

```text
35cb3ad1d1cd802bad62da0e74deb58f
```

n8n Notion node 使用 data source ID：

```text
292b3ad1d1cd8066b50c000b82565915
```

| LINE / Workflow value | Notion property |
|---|---|
| LINE display name 或 userId | `會員姓名` |
| LINE userId | `LINE ID` |
| LINE display name | `LINE名稱` |
| 預設或既有分類 | `人員屬性` |
| LIFF / follow / message / postback 來源 | `互動記錄標籤` |
| webhook 互動時間、頁面、訊息摘要 | `備註` |

## Workflow Generator

重建 LINE OA workflow JSON：

```powershell
node tools\generate-line-workflows.js
```
