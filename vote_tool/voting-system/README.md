# 投票系統前端

此資料夾是會員系統擴充用的純前端投票頁面，可直接放到 GitHub Pages。

## 檔案

- `index.html`：LIFF 投票頁，mobile 優先。
- `results.html`：即時票數看板，desktop/電視牆優先，每 5 秒輪詢一次。
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

`admin.html` 目前只會在搜尋姓名或選擇投票狀態後讀取投票人資料。`/vote-voters` 使用 `已投票` select 欄位篩選，選項值為 `Yes` / `No`。

`index.html` 的 LIFF ID 目前是 placeholder：

```js
const LIFF_ID = "LIFF_ID_HERE";
```

正式上線前請替換為 LINE Developers 後台建立的 LIFF ID。

## API

- `POST /vote-check`：查詢投票人，body `{ name, lineUserId }`，n8n workflow 以 Notion `姓名` title filter 查 1 筆，避免每次進入投票時讀取全名單。
- `POST /vote-submit`：送出投票，body `{ pageId, name, chairman, rep, city, lineUserId }`
- `GET /vote-results`：取得即時票數與候選人清單；看板每 5 秒呼叫一次，workflow 不再讀取投票人全表，票數由投票紀錄計算。
- `GET /vote-candidates`：管理員取得候選人清單，回傳 `{ candidates: [{ pageId, name, category, targetVotes }] }`。`targetVotes` 會讀候選人資料庫的 `達標數` / `達標票數` / `目標票數` / `票數` number 欄位。
- `POST /vote-candidate-save`：管理員更新候選人名稱、類別與達標數，body `{ pageId, oldName, name, category, targetVotes }`；會把達標數寫入候選人資料庫的 `達標數` 欄位。
- `POST /vote-change`：管理員更改預設投票對象，body `{ voterName, newChairman, newRep, newCity }`
- `GET /vote-voters?status=voted|unvoted`：管理員依投票狀態取得投票人清單，回傳 `{ voters: [...] }`。姓名搜尋使用 `/vote-check`，避免載入全名單。
- `POST /vote-voter-create`：管理員新增投票人，body `{ name, chairman, rep, city }`
- `GET /vote-target-setting`：取得設定，回傳 `{ settings: [{ key, value }] }`。看板只用它讀取 `totalVoters` / `total_voters` / `voterTotal` 作為總投票人數；候選人達標數改由候選人資料庫欄位提供。
- `POST /vote-target-setting`：儲存設定，body `{ key, value }`，例如 `{ key: "target_候選人姓名", value: 300 }`。

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
