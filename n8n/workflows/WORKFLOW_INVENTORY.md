# n8n workflows inventory

本資料夾只保留目前要使用或需要備份的 workflow JSON。

## 後台管理 workflow（最新版，請匯入/覆蓋 n8n）

| 檔案 | n8n workflow 名稱 | Webhook path | 用途 |
| --- | --- | --- | --- |
| `Admin Auth Staff.json` | Admin Auth Staff | `/admin-auth-staff` | 登入、人員列表、新增、編輯、刪除 |
| `Admin Cases.json` | Admin Cases | `/admin-cases` | 陳情案件列表、新增、編輯、刪除、負責人 relation |
| `Admin Events.json` | Admin Events | `/admin-events` | 活動列表、新增、編輯、刪除、負責人 relation、報名欄位 |
| `Admin Event Registrations.json` | Admin Event Registrations | `/admin-event-registrations` | 活動報名名單列表、狀態更新 |
| `Admin Legal Consultation.json` | Admin Legal Consultation | `/admin-legal-consultation` | 法律諮詢後台列表、編輯、刪除、法扶分類欄位 |
| `Admin Members.json` | Admin Members | `/admin-members` | 會員列表、標籤、狀態更新 |
| `Admin LINE OA Settings - Notion Nodes.json` | Admin LINE OA Settings - Notion Nodes | `/admin-line-accounts` | LINE OA 設定、Token/Secret 儲存 |
| `Admin Blog.json` | Admin Blog | `/admin-blog` | 後台部落格 CRUD |

## 公開 LIFF workflow

| 檔案 | n8n workflow 名稱 | Webhook path | 用途 |
| --- | --- | --- | --- |
| `Public Event Registration.json` | Public Event Registration | `/event-registration` | 活動報名 LIFF，寫入活動報名資料庫、比對 LINE User ID 重複報名 |
| `Public Legal Consultation.json` | Public Legal Consultation | `/legal-consultation` | 法律諮詢預約 LIFF，預約、查詢、取消 |
| `Public LINE OA Members - Notion Nodes.json` | Public LINE OA Members - Notion Nodes | `/line-oa-members` | LINE OA follow/message/postback 會員擷取 |

## 陳情 petition workflow（已補上 JSON 備份）

以下 workflow 依你提供的 n8n 截圖，已存在於 n8n，並已將 JSON export 備份放入本資料夾。

| 檔案 | n8n workflow | Webhook path | 用途 |
| --- | --- | --- | --- |
| `接收陳情表單petition submit.json` | 接收陳情表單petition/submit | `/petition/submit` | 品牌前台陳情表單資料來源 |
| `單筆案件查詢petition query.json` | 單筆案件查詢petition/query | `/petition/query` | 品牌前台用案件編號查詢 |
| `接收統計查詢petition stats.json` | 接收統計查詢petition/stats | `/petition/stats` | 品牌前台統計數字 |
| `查詢陳情案件petition list.json` | 查詢陳情案件petition/list | `/petition/list` | 品牌前台案件列表 |
| `儀表板趨勢查詢 petition dashboard.json` | 儀表板趨勢查詢 petition/dashboard | `/petition/dashboard` | 儀表板/趨勢查詢 |

## 注意

- 檔名已校正為 n8n workflow 名稱；若名稱含 `/`，檔名以空白取代。
- n8n 不能同時啟用兩個相同 webhook path 的 workflow。
- 截圖中 n8n 端出現兩筆 `Admin Legal Consultation`，本機目前只保留一份最新版 JSON；匯入前請停用 n8n 端舊版重複 workflow。
