# LIFF 入口與用途整理

本文件用來記錄 `tseng-service` 專案內所有 LINE LIFF 入口，避免活動報名、法律諮詢與後續公開表單混用。

## 目前 LIFF 清單

| 狀態 | LIFF 模組 | 用途 | 本機/專案路徑 | Cloudflare Endpoint URL | LIFF ID | n8n webhook |
| --- | --- | --- | --- | --- | --- | --- |
| 已設定 | 活動報名 LIFF | 民眾從 LINE 開啟活動報名表單，送出姓名、電話、同行人數、備註，並擷取 LINE User ID、LINE 名稱 | `liff/event-registration/` | `https://tseng-service.pages.dev/liff/event-registration/` | `2009640939-ACYipKCx` | `https://drwu.zeabur.app/webhook/event-registration` |
| 已設定 | 法律諮詢預約 LIFF | 民眾預約、查詢、取消法律諮詢 | `liff/legal-consultation/` | `https://tseng-service.pages.dev/liff/legal-consultation/` | `2009640939-vwvDFasL` | `https://drwu.zeabur.app/webhook/legal-consultation` |

## 活動報名 LIFF

### 作用

活動管理後台針對每一筆活動產生報名網址，民眾開啟後填寫活動報名資料。此 LIFF 會讀取 LINE profile，寫入活動報名資料庫。

### LINE Developers 設定

| 項目 | 設定值 |
| --- | --- |
| LIFF App name | 活動報名 |
| Size | Full |
| Endpoint URL | `https://tseng-service.pages.dev/liff/event-registration/` |
| LIFF ID | `2009640939-ACYipKCx` |
| Scope | `profile`、`openid` |
| Bot link feature | 建議 On |

### 民眾實際開啟網址

活動報名要帶活動 Notion Page ID：

```text
https://liff.line.me/2009640939-ACYipKCx?eventId=<活動NotionPageId>
```

也可以用 Cloudflare 頁面測試：

```text
https://tseng-service.pages.dev/liff/event-registration/?eventId=<活動NotionPageId>
```

### 對應資料庫

| 資料庫 | Notion Database ID | 用途 |
| --- | --- | --- |
| 活動資料庫 | `2cab3ad1d1cd804aa922caf1a7621f78` | 讀取活動資訊、確認活動是否可報名 |
| 活動報名資料庫 | `350b3ad1d1cd8094aaa3fb6bbf6c6d34` | 寫入民眾報名資料 |

## 法律諮詢預約 LIFF

### 目前狀態

法律諮詢 LIFF 已完成 LINE Developers 建立與正式 LIFF ID 設定。

### LINE Developers 設定

| 項目 | 設定值 |
| --- | --- |
| LIFF App name | 法律諮詢預約 |
| Size | Full |
| Endpoint URL | `https://tseng-service.pages.dev/liff/legal-consultation/` |
| LIFF ID | `2009640939-vwvDFasL` |
| LIFF URL | `https://liff.line.me/2009640939-vwvDFasL` |
| Scope | `profile`、`openid` |
| Bot link feature | 建議 On |

### 功能模式

法律諮詢頁面可透過 query string 切換模式：

```text
https://tseng-service.pages.dev/liff/legal-consultation/?mode=book
https://tseng-service.pages.dev/liff/legal-consultation/?mode=query
https://tseng-service.pages.dev/liff/legal-consultation/?mode=cancel
```

如果用 LINE LIFF 開啟，格式會是：

```text
https://liff.line.me/<法律諮詢LIFF_ID>?mode=book
https://liff.line.me/<法律諮詢LIFF_ID>?mode=query
https://liff.line.me/<法律諮詢LIFF_ID>?mode=cancel
```

正式 LIFF URL：

```text
https://liff.line.me/2009640939-vwvDFasL
https://liff.line.me/2009640939-vwvDFasL?mode=book
https://liff.line.me/2009640939-vwvDFasL?mode=query
https://liff.line.me/2009640939-vwvDFasL?mode=cancel
```

### 對應資料庫

| 資料庫 | Notion Database ID | 用途 |
| --- | --- | --- |
| 法扶諮詢資料庫 | `2ccb3ad1d1cd8175aba6e21110f71145` | 寫入預約、查詢預約、取消預約 |

## 後續新增 LIFF 的命名規則

新增 LIFF 時請固定使用以下格式：

| 類型 | 建議資料夾 | 建議 n8n webhook | 說明 |
| --- | --- | --- | --- |
| 公開表單 | `liff/<module-name>/` | `/webhook/<module-name>` | 民眾填寫資料來源 |
| 後台頁面 | 不放在 LIFF | 不使用 LIFF | 後台管理不應透過 LIFF 開放 |

目前「活動報名 LIFF」與「法律諮詢預約 LIFF」都已完成正式 LIFF ID 設定。
