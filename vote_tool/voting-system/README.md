# 投票系統前端

此資料夾是會員系統擴充用的純前端投票頁面，可直接放到 GitHub Pages。

## 檔案

- `index.html`：LIFF 投票頁，mobile 優先。
- `results.html`：即時票數看板，desktop/電視牆優先，每 30 秒輪詢一次。
- `admin.html`：管理員設定頁，預設密碼 `admin2026`，可設定達標人數與編輯投票人預設投票對象。
- `mock-data.json`：2 筆測試用假名單與候選人票數範例。

## 設定

目前 API base URL：

```txt
https://drwu.zeabur.app/webhook
```

目前三個頁面都先啟用假資料模式：

```js
const USE_MOCK_DATA = true;
```

可測試姓名：

- `林佳蓉`：尚未投票
- `張宏宇`：已投票

正式串接 n8n 時，請把三個頁面的 `USE_MOCK_DATA` 改成 `false`。

`admin.html` 目前清單模式會讀取 `/vote-voters` 作為投票人列表來源；假資料模式下使用內建 2 筆名單。正式串接 n8n 時需補上此清單 endpoint，回傳格式可為 `{ voters: [...] }`。

`index.html` 的 LIFF ID 目前是 placeholder：

```js
const LIFF_ID = "LIFF_ID_HERE";
```

正式上線前請替換為 LINE Developers 後台建立的 LIFF ID。

## API

- `POST /vote-check`：查詢投票人，body `{ name, lineUserId }`
- `POST /vote-submit`：送出投票，body `{ pageId, name, chairman, rep, city, lineUserId }`
- `GET /vote-results`：取得即時票數與候選人清單
- `POST /vote-change`：管理員更改預設投票對象，body `{ voterName, newChairman, newRep, newCity }`
- `GET /vote-voters`：管理員取得投票人清單，回傳 `{ voters: [...] }`
- `POST /vote-voter-create`：管理員新增投票人，body `{ name, chairman, rep, city }`
- `GET /vote-target-setting`：取得達標人數，回傳 `{ targetVotes }`
- `POST /vote-target-setting`：儲存達標人數，body `{ targetVotes }`

## n8n workflows

新增管理功能 workflow 放在 `vote_tool/n8n workflow`：

- `vote-voters.json`
- `vote-voter-create.json`
- `vote-target-setting-get.json`
- `vote-target-setting-save.json`

達標人數 workflow 需要一個 Notion 設定資料庫，欄位建議為：

- `鍵`：title，固定建立一筆 `targetVotes`
- `數值`：number，例如 `300`

匯入 `vote-target-setting-get.json` 與 `vote-target-setting-save.json` 後，請把 `REPLACE_WITH_VOTE_SETTINGS_DATABASE_ID` 換成此設定資料庫 ID。

## 部署

將 `vote_tool/voting-system` 內容推送到 GitHub Pages 對應路徑即可。n8n webhook 需處理 CORS response header：

```txt
Access-Control-Allow-Origin: *
```
