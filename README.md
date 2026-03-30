# tseng-service

> 北屯耀進 曾咨耀議員服務處 — 線上陳情服務平台

市民可透過本平台線上提交陳情案件、查詢辦理進度；幕僚透過 Notion 進行案件管理。  
前端為純靜態 HTML，資料層使用 Notion 資料庫，自動化流程透過 n8n Webhook 串接。

---

## 📁 專案結構

```
tseng-service/
├── index.html        主頁面（首頁統計 + 陳情列表）
├── form.html         線上陳情表單
├── assets/           圖片、議員照片（選填）
└── README.md         本文件
```

---

## ✨ 功能說明

### 市民端
| 功能 | 說明 |
|------|------|
| 首頁統計 | 即時顯示陳情案件數、地方會勘、國會質詢、國會提案數量 |
| 陳情列表 | 8 大分類 Tab 篩選、進度狀態篩選、每頁 15 筆分頁瀏覽 |
| 線上陳情 | 填寫表單送出後取得案件編號，幕僚主動電話聯繫 |
| 個資保護 | 列表頁不顯示任何個人資料，僅顯示案件標題與進度 |

### 幕僚端（Notion）
| 功能 | 說明 |
|------|------|
| 案件管理 | 在 Notion DB1 新增、更新案件狀態與回覆內容 |
| 公開控制 | 勾選「是否公開」才會顯示到網站列表 |
| 圖片上傳 | 可上傳改善前／後圖片到 Notion 欄位 |
| 統計更新 | 到 DB5 更新地方會勘、質詢、提案數字即反映到首頁 |

---

## 🗄️ Notion 資料庫架構

| 資料庫 | 用途 |
|--------|------|
| DB1 陳情案件主庫 | 所有陳情案件資料，含個資欄位（幕僚專用） |
| DB2 地方會勘資料庫 | 地方會勘紀錄 |
| DB3 國會質詢資料庫 | 國會質詢紀錄 |
| DB4 國會提案資料庫 | 國會提案紀錄 |
| DB5 網站設定庫 | 首頁手動更新的統計數字 |

### DB1 欄位清單

| 欄位名稱 | 類型 | 公開 |
|---------|------|------|
| 案件標題 | Title | ✅ |
| 案件編號 | Text | ✅ |
| 案件類型 | Select | ✅ |
| 案件區域 | Select | ✅ |
| 案件狀態 | Select | ✅ |
| 是否公開 | Checkbox | — |
| 公開摘要 | Text | ✅ |
| 回覆內容 | Text | ✅ |
| 改善前圖片 | Files | ✅ |
| 改善後圖片 | Files | ✅ |
| 建立時間 | Created time | ✅ |
| 上次編輯時間 | Last edited time | ✅ |
| 陳情人姓名 | Text | ❌ 不對外顯示 |
| 聯絡手機 | Phone | ❌ 不對外顯示 |
| 聯絡 Email | Text | ❌ 不對外顯示 |
| 聯絡地址 | Text | ❌ 不對外顯示 |
| 案件原始內容 | Text | ❌ 不對外顯示 |

---

## ⚙️ n8n Webhook 清單

| 編號 | 路徑 | 方法 | 功能 |
|------|------|------|------|
| Webhook 1 | `/webhook/petition/submit` | POST | 市民送出陳情表單 → 寫入 Notion DB1 → LINE 通知幕僚 |
| Webhook 2 | `/webhook/petition/list` | GET | 查詢公開案件列表（支援類別、狀態、分頁篩選） |
| Webhook 3 | `/webhook/petition/stats` | GET | 首頁四個統計數字 |

### Webhook 2 查詢參數

```
GET /webhook/petition/list
  ?category=交通運輸    （選填，空值=全部）
  &status=處理中        （選填，空值=全部）
  &page=1               （分頁，每頁 15 筆）
```

### Webhook 3 回傳格式

```json
{
  "success": true,
  "petitions": 342,
  "inspections": 87,
  "interpellations": 45,
  "proposals": 120
}
```

---

## 🚀 部署方式

### GitHub Pages（建議）

```bash
# 1. Clone 或直接上傳兩個 HTML 到 Repository
# 2. GitHub Repository → Settings → Pages
# 3. Source 選 main branch → / (root)
# 4. 儲存後取得網址：https://你的帳號.github.io/tseng-service/
```

### 自有主機

```bash
# 將 index.html 與 form.html 放到 web root 即可
# 無需任何後端環境，純靜態檔案
```

---

## 🔧 設定方式

部署後只需修改兩個 HTML 頂部的 Config 區塊：

### index.html

```javascript
const WEBHOOK_STATS = 'https://你的n8n網域/webhook/petition/stats';
const WEBHOOK_LIST  = 'https://你的n8n網域/webhook/petition/list';
```

### form.html

```javascript
const WEBHOOK_SUBMIT = 'https://你的n8n網域/webhook/petition/submit';
```

---

## 🔐 安全設定（上線前必做）

### 1. API Key 防護（Webhook 1）

在 n8n「接收陳情表單」節點：
```
Authentication → Header Auth
Name  : x-api-key
Value : 自訂密鑰字串
```

在 form.html 的 fetch 加上 header：
```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': '你設定的密鑰'
}
```

### 2. CORS 限制（有正式網域後）

將三個 Webhook 回傳節點的 Response Header 從：
```
Access-Control-Allow-Origin: *
```
改為：
```
Access-Control-Allow-Origin: https://你的正式網域
```

### 3. 防垃圾表單

form.html 已內建 3 秒時間限制，正常填寫不受影響。

---

## 📋 陳情類別

| 類別 | 包含範圍 |
|------|---------|
| 交通運輸 | 道路、停車、號誌 |
| 公共設施 | 公園、路燈、排水 |
| 衛福勞動 | 補助、長照、勞資 |
| 文教科技 | 學校、文化、科技 |
| 環境建管 | 噪音、空污、建照 |
| 警消政風 | 治安、消防、政風 |
| 市政議題 | 市府政策、法規 |
| 其他服務 | 其他 |

---

## 📍 服務處資訊

- **地址**：406 台中市北屯區東山路一段 156-6 號
- **電話**：04-2436-2995
- **服務時間**：週一至週五 09:00–18:00
- **Facebook**：[北屯耀進 曾咨耀](https://www.facebook.com/OnlyTseng/)

---

## 🛠️ 技術架構

```
前端        純靜態 HTML / CSS / JavaScript
資料庫      Notion（5 個資料庫）
自動化      n8n（3 個 Webhook Workflow）
通知        LINE Messaging API
部署        GitHub Pages / 任意靜態主機
```

---

## 📅 版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| v1.0 | 2025-03 | 初版：首頁統計、陳情列表、線上表單 |

---

> ⚠️ 本 Repository 不包含任何 API Key、Notion Token 或 n8n Webhook 密鑰。  
> 所有敏感資訊請自行填入 HTML 的 Config 區塊，切勿 commit 到版本控制。
