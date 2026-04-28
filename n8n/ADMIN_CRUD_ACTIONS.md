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
    "title": "案件主題",
    "petitioner": "陳情人",
    "phone": "0912345678",
    "caseNo": "1999案號",
    "startDate": "2026-04-28",
    "status": "進行中",
    "owner": "staff-page-id",
    "category": "建議事項類別",
    "summary": "執行狀況敘述",
    "content": "案件詳細說明"
  }
}
```

Notion fields:

| Payload | Notion property |
|---|---|
| `title` | `案件主題&詳情` |
| `petitioner` | `陳情人姓名` |
| `phone` | `陳情人連絡電話` |
| `caseNo` | `1999案號` |
| `startDate` | `處理起始日期` |
| `status` | `執行狀態` |
| `owner` | `負責人員` relation to 工作人員管理DB |
| `category` | `建議事項類別` |
| `summary` | `局處回覆摘要` |
| `content` | `案件詳細說明` |

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
