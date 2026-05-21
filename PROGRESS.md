# 曾咨耀服務處系統開發進度

> 最後更新：2026-05-14  
> 本文件由所有協作 AI（Claude Code、Gemini、Codex 等）共同維護，**每次執行前必須先讀取此檔案確認現況**

---

## 🌐 網站架構

```
前台（對外民眾）     index.html（Cloudflare Pages）
  ├── 首頁           統計數字、陳情概覽、最新消息
  ├── 陳情服務       案件列表篩選、案件查詢（公開）
  ├── 活動報名       LIFF：liff/event-registration/
  ├── 法律諮詢       LIFF：liff/legal-consultation/
  └── 議政日報       部落格文章列表（對應後台內容管理）

後台（內部人員）     zcy-staff-console-406/index.html（防爬蟲）
  ├── 陳情案件       CRUD + Excel 批量匯入 + 圖片上傳
  ├── 活動管理       CRUD + 月/週曆
  ├── 任務查看       跨類型任務彙整
  ├── 活動報名名單   報名管理
  ├── 會員名單       會員列表
  ├── 法扶諮詢       預約管理
  ├── 人員管理       Admin only
  ├── LINE OA 設定   Admin only
  └── 文章管理       部落格 CRUD（待開發）

資料層              Notion（所有 DB）
自動化              n8n（Zeabur，透過 webhook 存取 Notion）
LINE 整合           Messaging API + LIFF SDK
部署                Cloudflare Pages（前後台靜態） + Zeabur（n8n）
```

---

## 📱 設計規範

- **RWD 優先**：前台與後台均須支援 Mobile 使用情境
- 前台：Mobile 使用者為主（市民從 LINE 點入）
- 後台：Desktop 為主，Mobile 需可基本操作

---

## ✅ 已完成

| 功能 | 說明 | 相關檔案 |
|-----|------|---------|
| 前台首頁 SPA | 統計、陳情列表、案件查詢 | `index.html` |
| 陳情表單前台 | 公開表單提交 | `form.html` |
| LIFF 活動報名 | LINE 活動表單 | `liff/event-registration/` |
| LIFF 法律諮詢 | 預約 / 查詢 / 取消 | `liff/legal-consultation/` |
| 後台登入驗證 | 幕僚帳號登入 | `js/zcy-console.js` |
| 後台人員管理 | 帳號 CRUD | `js/zcy-console.js` |
| 後台活動管理 | 活動 CRUD + 月/週曆 | `js/zcy-console.js` |
| 後台法扶諮詢 | 預約列表管理 | `js/zcy-console.js` |
| 後台會員名單 | 會員列表 | `js/zcy-console.js` |
| n8n petition 工作流 | 5 支（list / submit / query / stats / dashboard） | `n8n/workflows/` |
| n8n admin CRUD 工作流 | cases / events / staff / legal | `n8n/workflows/` |

---

## 🔄 進行中（本階段）

### 項目 5：陳情案件 DB 統一 ＋ Excel 匯入

| 子項目 | 狀態 | 說明 |
|-------|------|------|
| `config.js` DB ID 切換 | ✅ 完成 | `29cb3ad1...` → `330b3ad1...` |
| n8n workflow DB ID 更新 | ✅ 完成 | Create / Update / Query 全部對應新 DB |
| `請託案號` 設為 Notion Title | ✅ 完成 | Create 用 `title` 欄、Update 用 `\|title` 類型 |
| 移除 `案件標題` 欄位 | ✅ 完成 | Normalize Cases 移除多餘 title 欄 |
| 欄位映射改為 Excel 欄位名 | ✅ 完成 | 共 13 個欄位（移除住家電話、戶籍地址）|
| 後台表單欄位更新 | ✅ 完成 | `openCaseForm` 對應所有 Excel 欄位 |
| 後台列表欄位更新 | ✅ 完成 | 顯示請託案號 / 類別 / 接案秘書 / 狀態 / 當事人名 |
| 搜尋邏輯更新 | ✅ 完成 | 以 `caseNo / staff / petitioner / category / content` 搜尋 |
| 流水號自動產生 | ✅ 完成 | `generateCaseNo()`：民國年 + MMDD + 3 位序號（如 `1150513001`） |
| 新案件日期預設今天 | ✅ 完成 | `requestDate` 預設 ISO 今日 |
| Excel 批量匯入 | ✅ 完成 | SheetJS 解析 + 預覽 + 逐筆 POST + 進度顯示 |
| ROC 日期轉換 | ✅ 完成 | `convertRocDate()`：支援 `115.0508`、`1150508`、`yyyy/m/d` 等格式 |
| `ADMIN_CRUD_ACTIONS.md` 更新 | ✅ 完成 | 欄位說明 / 個資標註 / 前台顯示欄位 |

### 項目 3：後台陳情案件圖片上傳

| 子項目 | 狀態 | 說明 |
|-------|------|------|
| imgbb API key 設定欄位 | ✅ 完成 | `config.js` 新增 `imgbbApiKey: ""` |
| `image-upload` 欄位類型 | ✅ 完成 | `renderField` 支援縮圖預覽 + 刪除 |
| imgbb 上傳邏輯 | ✅ 完成 | `uploadToImgbb()` base64 → imgbb → URL |
| 上傳事件綁定 | ✅ 完成 | `openModal` 自動掛 file input change + remove 事件 |
| n8n Create Cases 圖片欄位 | ✅ 完成 | `改善前圖片\|files` + `改善後圖片\|files` |
| n8n Update Cases 圖片欄位 | ✅ 完成 | 同上 |
| 圖片上傳 CSS | ✅ 完成 | `.upload-thumb` / `.upload-add-btn` / `.upload-progress` 等 |
| 唯讀欄位樣式 | ✅ 完成 | `.field input[readonly]`：虛線邊框 + 次要文字色 |

### 待用戶手動操作（未完成）

| 動作 | 說明 |
|-----|------|
| Notion DB 重命名 Title 欄位 | DB `330b3ad1...` 的 title 欄改名為「請託案號」|
| Notion DB 新增欄位（10 個） | 請託日期、接案秘書、當事人名、行動電話、通訊地址、委託人名、關係、託辦事項、處理天數、交辦會勘記錄 |
| `config.js` 填入 imgbb API key | `imgbbApiKey: "YOUR_KEY"` |
| Zeabur n8n 重新匯入 workflow | `Admin Cases.json` |

---

## ❌ 待開發

| 功能 | 類別 | 優先度 | 說明 |
|-----|------|-------|------|
| 部落格後台（文章管理） | 後台 | 高 | n8n workflow 完成，待開發後台 CRUD UI |
| 議政日報前台 section | 前台 | 高 | n8n workflow 完成，待開發前台分類列表 + 文章詳情 |
| 全專案 RWD 優化 | 前台 + 後台 | 高 | Mobile 優先，後台側欄改 hamburger |
| AI 智能問答 | 民眾入口 | 低 | LINE OA 整合 AI 回覆 |
| 語音轉文字 | AI 助理 | 低 | 陳情語音輸入 |
| 陳情摘要與分類（AI） | AI 助理 | 低 | n8n + LLM 自動分類 |
| 知識資料 FAQ | 資料管理 | 低 | 常見問題資料庫 |

---

## Notion 資料庫 ID

| 資料庫 | ID | 狀態 |
|-------|-----|------|
| 陳情案件（主要） | `330b3ad1d1cd8047aabfc9e95de6658d` | ✅ 前後台統一使用 |
| 陳情案件（舊，棄用） | `29cb3ad1d1cd80da82b5fddde82ebe4d` | ⛔ 停用 |
| 活動 | `2cab3ad1d1cd804aa922caf1a7621f78` | ✅ |
| 活動報名 | `350b3ad1d1cd8094aaa3fb6bbf6c6d34` | ✅ |
| 幕僚 | `350b3ad1d1cd801797a7dcf6f06c7f13` | ✅ |
| 會員 | `35cb3ad1d1cd802bad62da0e74deb58f` | ✅ |
| 法扶諮詢 | `2ccb3ad1d1cd8175aba6e21110f71145` | ✅ |
| 部落格 | `360b3ad1d1cd80b8a870de2164fedb7b` | ✅ 已建立 |

---

## 關鍵檔案索引

| 檔案 | 用途 |
|-----|------|
| `js/config.js` | DB ID、webhook URL、imgbb key |
| `js/zcy-console.js` | 後台所有功能邏輯（主體） |
| `js/api.js` | API wrapper |
| `css/zcy-console.css` | 後台樣式 |
| `index.html` | 前台主頁（SPA，民眾用） |
| `form.html` | 公開陳情表單 |
| `zcy-staff-console-406/index.html` | 後台 HTML 入口（防爬蟲路徑） |
| `n8n/workflows/Admin Cases.json` | 後台陳情 CRUD（需 re-import） |
| `n8n/workflows/Admin Blog.json` | 後台部落格 CRUD（需 import） |
| `n8n/workflows/查詢陳情案件petition list.json` | 公開案件查詢 |
| `n8n/workflows/接收陳情表單petition submit.json` | 公開表單提交 |
| `n8n/ADMIN_CRUD_ACTIONS.md` | API 規格文件 |
| `PROGRESS.md` | 本開發進度文件 |
