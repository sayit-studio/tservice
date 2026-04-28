# Event registration LIFF

Public LIFF page:

```text
event-registration/index.html?eventId=<notion-event-page-id>
```

Config:

```js
window.EVENT_REGISTRATION_CONFIG = {
  liffId: "LINE_LIFF_ID",
  webhookBaseUrl: "https://drwu.zeabur.app/webhook/event-registration"
};
```

## Admin event fields

The activity edit form now sends these additional fields through `events.create` / `events.update`:

| Payload | Suggested Notion property | Type |
|---|---|---|
| `registrationEnabled` | `報名表單` | Select / Checkbox |
| `registrationDeadline` | `報名截止時間` | Date |
| `registrationLimit` | `報名名額上限` | Number |
| `registrationUrl` | `報名表單網址` | URL |
| `registrationNote` | `報名注意事項` | Rich text |

The n8n `admin-events` workflow should include these fields in list/create/update responses.

## Public registration payload

Endpoint:

```text
POST /webhook/event-registration
```

Payload:

```json
{
  "action": "event.register",
  "source": "line-liff",
  "submittedAt": "2026-04-28T00:00:00.000Z",
  "data": {
    "eventId": "notion-event-page-id",
    "name": "報名者姓名",
    "phone": "0912345678",
    "companions": "0",
    "note": "備註",
    "lineUserId": "LINE userId",
    "lineDisplayName": "LINE display name",
    "liffLanguage": "zh-TW",
    "liffOS": "ios",
    "isInClient": true
  }
}
```

## Suggested registration database

Create a separate Notion database for event registrations. Do not write registrations into the activity database directly.

| Field | Type |
|---|---|
| `報名編號` | Title |
| `活動` | Relation to 活動資料庫 |
| `活動ID` | Rich text |
| `姓名` | Rich text |
| `電話` | Phone |
| `同行人數` | Number |
| `備註` | Rich text |
| `LINE User ID` | Rich text |
| `LINE 名稱` | Rich text |
| `LIFF 語言` | Rich text |
| `LIFF 系統` | Rich text |
| `是否 LINE 內開啟` | Checkbox |
| `建立時間` | Date |
| `狀態` | Select: `registered`, `cancelled` |

## n8n behavior

For `event.register`:

1. Validate `eventId`, `name`, and `phone`.
2. Read the activity page by `eventId`.
3. If `報名表單` is not enabled, reject.
4. If `報名截止時間` has passed, reject.
5. Count active registrations for the event if `報名名額上限` is set.
6. Reject if full.
7. Create a registration page in the event registration database.
8. Return:

```json
{
  "ok": true,
  "message": "報名成功",
  "registrationId": "REG-20260428-001"
}
```

Optional next step: send LINE Flex Message to internal staff when a registration is created.
