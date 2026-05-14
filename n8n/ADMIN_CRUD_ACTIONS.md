# Admin CRUD action contract

The backend now sends these actions to n8n. Existing list actions are working; create/update/delete must be added to the corresponding n8n workflows.

## Shared response format

Success:

```json
{ "ok": true, "data": {} }
```

Failure:

```json
{ "ok": false, "message": "錯誤訊息" }
```

## Staff

Endpoint: `/admin-auth-staff`

| Action | Purpose |
|---|---|
| `login` | Login by `account` and `password` |
| `staff.list` | List staff |
| `staff.create` | Create staff page |
| `staff.update` | Update staff page by `data.id` |
| `staff.delete` | Archive staff page by `id` |

Payload:

```json
{
  "action": "staff.update",
  "data": {
    "id": "notion-page-id",
    "name": "王烏烏",
    "account": "wang",
    "password": "admin528",
    "identity": "管理員",
    "permissions": "管理員"
  }
}
```

Notion fields:

| Payload | Notion property |
|---|---|
| `name` | `人員名稱` |
| `account` | `帳號` |
| `password` | `密碼` |
| `identity` | `身分` |
| `permissions` | `權限設定` |

## Cases

Endpoint: `/admin-cases`

**Notion DB:** `330b3ad1d1cd8047aabfc9e95de6658d`

| Action | Purpose |
|---|---|
| `cases.list` | List cases |
| `cases.create` | Create case |
| `cases.update` | Update case by `data.id` |
| `cases.delete` | Archive case by `id` |

Payload:

```json
{
  "action": "cases.update",
  "data": {
    "id": "notion-page-id",
    "caseNo": "1150508001",
    "requestDate": "2026-05-08",
    "category": "醫療院所",
    "staff": "接案秘書姓名",
    "petitioner": "當事人名",
    "homePhone": "04-2345678",
    "phone": "0912345678",
    "address": "通訊地址",
    "registeredAddress": "戶籍地址",
    "commissioner": "委託人名",
    "relation": "關係",
    "content": "託辦事項內容",
    "status": "處理中",
    "processingDays": 3,
    "inspectionNote": "交辦會勘記錄",
    "summary": "公開摘要（前台顯示）"
  }
}
```

Notion fields (欄位名稱依 Excel 原始格式):

| Payload field | Notion property | Type | 前台顯示 |
|---|---|---|---|
| `caseNo` | `請託案號` | Rich Text | ✅ |
| `requestDate` | `請託日期` | Date | ✅ |
| `category` | `託辦類別` | Select | ✅ |
| `staff` | `接案秘書` | Rich Text | ❌ |
| `petitioner` | `當事人名` | Rich Text | ❌ 個資 |
| `homePhone` | `住家電話` | Phone Number | ❌ 個資 |
| `phone` | `行動電話` | Phone Number | ❌ 個資 |
| `address` | `通訊地址` | Rich Text | ❌ 個資 |
| `registeredAddress` | `戶籍地址` | Rich Text | ❌ 個資 |
| `commissioner` | `委託人名` | Rich Text | ❌ 個資 |
| `relation` | `關係` | Rich Text | ❌ |
| `content` | `託辦事項` | Rich Text | ❌ |
| `status` | `處理狀況` | Select | ✅ |
| `processingDays` | `處理天數` | Number | ❌ |
| `inspectionNote` | `交辦會勘記錄` | Rich Text | ❌ |
| `summary` | `公開摘要` | Rich Text | ✅ |
| — | `改善前圖片` | Files | ✅ |
| — | `改善後圖片` | Files | ✅ |
| — | `是否公開` | Checkbox | 控制前台可見 |

**注意：** 前台查詢（petition_query/petition_list workflow）繼續使用 `案件編號` 欄位，供市民提交的案件使用（格式 SVC-YYYYMMDD-XXXX）。後台內部案件使用 `請託案號` 欄位（格式 YYYYMMDDXXX）。

## Events

Endpoint: `/admin-events`

| Action | Purpose |
|---|---|
| `events.list` | List events |
| `events.create` | Create event |
| `events.update` | Update event by `data.id` |
| `events.delete` | Archive event by `id` |

Payload:

```json
{
  "action": "events.update",
  "data": {
    "id": "notion-page-id",
    "title": "活動主題",
    "date": "2026-04-28T15:00",
    "status": "籌備中",
    "owner": "staff-page-id",
    "community": "社區名稱",
    "venue": "活動場地",
    "expectedPeople": "30",
    "contact": "聯絡人",
    "phone": "聯絡電話",
    "detail": "活動詳情"
  }
}
```

Notion fields:

| Payload | Notion property |
|---|---|
| `title` | `活動主題` |
| `date` | `活動日期` |
| `status` | `活動狀態` |
| `owner` | `負責人員` relation to 工作人員管理DB |
| `community` | `社區名稱` |
| `venue` | `活動場地` |
| `expectedPeople` | `人數預計` |
| `contact` | `活動聯絡人` |
| `phone` | `活動聯絡人電話` |
| `detail` | `活動詳情` |

## Legal consultation

Endpoint: `/admin-legal-consultation`

| Action | Purpose |
|---|---|
| `legal.list` | List legal consultations |
| `legal.update` | Update legal consultation by `data.id` |
| `legal.delete` | Archive legal consultation by `id` |

Payload:

```json
{
  "action": "legal.update",
  "data": {
    "id": "notion-page-id",
    "appointmentId": "LAW-20260428-001",
    "name": "姓名",
    "phone": "電話",
    "appointmentDate": "2026-04-28T15:00",
    "status": "confirmed",
    "category": "民事",
    "case1999": "1999案號",
    "attachmentUrl": "https://example.com/file",
    "otherName": "其它項目名稱",
    "statement": "事件陳述"
  }
}
```

Notion fields:

| Payload | Notion property |
|---|---|
| `appointmentId` | `預約編號` |
| `name` | `姓名` |
| `phone` | `電話` |
| `appointmentDate` | `預約日期` |
| `status` | `狀態` |
| `category` | `法扶項目` |
| `case1999` | `1999案號` |
| `attachmentUrl` | `附件連結` |
| `otherName` | `其它項目名稱` |
| `statement` | `事件陳述` |

## Delete behavior

For delete actions, use Notion archive/delete page behavior rather than permanently deleting database structure. The backend sends:

```json
{ "action": "cases.delete", "id": "notion-page-id" }
```
