# 法律諮詢預約系統

這是一個可部署為 LINE LIFF Endpoint 的靜態表單頁。建議整個資料夾放在 `tseng-service/legal-consultation/`，與既有線上陳情系統分開，避免覆蓋 repo 根目錄的 `index.html` 或 `form.html`。

- 立即預約：陳情人姓名、聯絡電話、簡單事件陳述、預約日期與時間
- 預約資訊查詢：用預約編號查詢預約日期與時間
- 取消預約：民眾取消後，系統主動通知服務同仁
- 所有表單結果送到 n8n webhook，由 n8n 寫入指定 Notion database；若有設定團隊 LINE target，會通知服務同仁

## 預約時間規則

- 開放日：週一至週五
- 開始時間：下午 3 點
- 間隔：每 15 分鐘一個預約點
- 預設最後一格：17:00
- 選擇日期後會向 n8n 查詢目前可預約時段，已額滿的時段會顯示為「已額滿」且不能選

可在 `config.js` 調整：

```js
bookingStartHour: 15,
bookingEndHour: 17,
bookingEndMinute: 0,
bookingIntervalMinutes: 15,
enableAvailabilityLookup: true
```

## 設定

打開 `config.js`，替換下列值：

```js
window.APP_CONFIG = {
  liffId: "你的 LINE LIFF ID",
  webhookBaseUrl: "你的 n8n production webhook URL",
  teamLineTarget: "營運團隊 LINE userId/groupId/roomId"
};
```

正式環境建議把 `teamLineTarget` 固定在 n8n 端，不要完全信任前端傳入值。預約資料目前預設寫入 Notion database `350b3ad1d1cd803ba6eacedca95d3f0a`，也可用 n8n 環境變數 `NOTION_DATABASE_ID` 覆蓋。

## LIFF URL

同一個頁面用 query string 切換功能：

- 立即預約：`https://your-domain.example/legal-consultation/index.html?mode=book`
- 預約資訊查詢：`https://your-domain.example/legal-consultation/index.html?mode=query`
- 取消預約：`https://your-domain.example/legal-consultation/index.html?mode=cancel`

若使用 GitHub Pages，且 repo 名稱為 `tseng-service`，網址通常會是：

- 立即預約：`https://<github-user>.github.io/tseng-service/legal-consultation/index.html?mode=book`
- 預約資訊查詢：`https://<github-user>.github.io/tseng-service/legal-consultation/index.html?mode=query`
- 取消預約：`https://<github-user>.github.io/tseng-service/legal-consultation/index.html?mode=cancel`

## 檔案

- `legal-consultation/index.html`：LIFF 表單頁
- `legal-consultation/styles.css`：色票風格樣式
- `legal-consultation/app.js`：LIFF 初始化、日期時段限制、表單送出、關閉視窗
- `legal-consultation/config.js`：LIFF ID、n8n webhook、預約時間設定
- `legal-consultation/n8n-workflow.json`：可直接匯入 n8n 的 Notion workflow
