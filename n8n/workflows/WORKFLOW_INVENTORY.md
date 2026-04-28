# n8n workflows inventory

本資料夾只保留目前要使用或需要備份的 workflow JSON。

## 後台管理 workflow（最新版，請匯入/覆蓋 n8n）

| 檔案 | n8n workflow 名稱 | Webhook path | 用途 |
| --- | --- | --- | --- |
| `REPLACE_admin-auth-staff_CRUD.json` | Admin Auth Staff | `/admin-auth-staff` | 登入、人員列表、新增、編輯、刪除 |
| `REPLACE_admin-cases_CRUD_Notion_relation.json` | Admin Cases | `/admin-cases` | 陳情案件列表、新增、編輯、刪除、負責人 relation |
| `REPLACE_admin-events_CRUD_Notion_relation.json` | Admin Events | `/admin-events` | 活動列表、新增、編輯、刪除、負責人 relation、報名欄位 |
| `REPLACE_admin-legal-consultation_CRUD.json` | Admin Legal Consultation | `/admin-legal-consultation` | 法律諮詢後台列表、編輯、刪除、法扶分類欄位 |

## 公開 LIFF workflow

| 檔案 | n8n workflow 名稱 | Webhook path | 用途 |
| --- | --- | --- | --- |
| `public-event-registration.json` | Public Event Registration | `/event-registration` | 活動報名 LIFF，寫入活動報名資料庫、比對 LINE User ID 重複報名 |
| `public-legal-consultation.json` | Public Legal Consultation | `/legal-consultation` | 法律諮詢預約 LIFF，預約、查詢、取消 |

## 陳情 petition workflow（已補上 JSON 備份）

以下 workflow 依你提供的 n8n 截圖，已存在於 n8n，並已將 JSON export 備份放入本資料夾。

| 檔案 | n8n workflow | Webhook path | 用途 |
| --- | --- | --- | --- |
| `接收陳情表單petition_submit.json` | 接收陳情表單 | `/petition/submit` | 品牌前台陳情表單資料來源 |
| `單筆案件查詢petition_query.json` | 單筆案件查詢 | `/petition/query` | 品牌前台用案件編號查詢 |
| `接收統計查詢petition_stats.json` | 接收統計查詢 | `/petition/stats` | 品牌前台統計數字 |
| `查詢陳情案件petition_list.json` | 查詢陳情案件 | `/petition/list` | 品牌前台案件列表 |
| `儀表板趨勢查詢 petition_dashboard.json` | 儀表板趨勢查詢 | `/petition/dashboard` | 儀表板/趨勢查詢 |

## 注意

- 舊版 `admin-*.json` 已移除，避免匯入錯版本。
- n8n 不能同時啟用兩個相同 webhook path 的 workflow。
- 匯入 `REPLACE_*.json` 前，請先停用 n8n 裡同名舊 workflow。
