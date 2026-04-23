# n8n 與 LINE Flex Message 串接

## 目前確認的 LINE 回覆狀況

| 狀況 | 觸發 | 回覆對象 | 建議回覆 |
| --- | --- | --- | --- |
| 立即預約成功 | `action = book` 且寫入成功 | 民眾 LINE | 預約已送出或已成功，顯示姓名、預約日期、預約時間、預約編號 |
| 新預約通知 | `action = book` 且寫入成功 | 服務同仁 LINE | 新預約通知，顯示陳情人姓名、電話、時間、事件陳述 |
| 預約資訊查詢成功 | `action = query` 且查到資料 | 民眾 LINE | 您已預約成功，顯示幾號幾點與預約編號 |
| 預約資訊查無資料 | `action = query` 但查不到 | 民眾 LINE | 查無預約資料，請確認預約編號或電話末三碼 |
| 民眾取消成功 | `action = cancel` 且更新成功 | 民眾 LINE | 已收到取消預約，顯示原預約時間 |
| 民眾取消通知 | `action = cancel` 且更新成功 | 服務同仁 LINE | 民眾已取消預約，顯示姓名、電話、原預約時間、原因 |
| 取消失敗或不可取消 | `action = cancel` 但查不到或狀態不允許 | 民眾 LINE | 無法取消，請確認預約編號或聯繫服務同仁 |
| 查詢可預約時段 | `action = availability` 且民眾選擇日期 | 前端 LIFF | 回傳可預約與已額滿時段，讓前端即時顯示 |

待你確認的細節：

- 預約送出後是直接視為「預約成功」，還是先顯示「已收到，待同仁確認」？
- 下午 3 點開始後，最後可預約時間目前先設為 `17:00`，是否要改到 `18:00` 或其他時間？
- 查詢與取消是否只允許同一個 LINE userId 操作自己的預約？

## 前端 payload

```json
{
  "action": "book",
  "actionLabel": "立即預約",
  "source": "line-liff",
  "submittedAt": "2026-04-23T08:00:00.000Z",
  "line": {
    "userId": "Uxxxxxxxx",
    "displayName": "王小明",
    "pictureUrl": "https://..."
  },
  "teamLineTarget": "營運團隊_LINE_USER_OR_GROUP_ID",
  "data": {
    "name": "王小明",
    "phone": "0912345678",
    "appointmentDate": "2026-04-24",
    "appointmentTime": "15:15",
    "statement": "簡單事件陳述",
    "consent": "on"
  }
}
```

## 建議 n8n 流程

1. `Webhook` 接收 LIFF payload。
2. `Switch` 依 `body.action` 分流：`availability`、`book`、`query`、`cancel`。
3. `availability`：
   - 接收 `body.data.appointmentDate`。
   - 查詢該日期已被預約且未取消的時段。
   - 回傳 `availableSlots` 與 `bookedSlots`。
3. `book`：
   - 驗證姓名、電話、事件陳述、日期、時間。
   - 驗證日期為週一至週五、時間為 15 分鐘間隔。
   - 檢查該時間是否已被預約。
   - 若已被預約，回 `409` 與最新可預約時段，前端會提示民眾改選。
   - 建立預約編號，例如 `LAW-YYYYMMDD-001`。
   - 寫入資料庫或 Google Sheet。
   - Push Flex 給民眾。
   - Push Flex 給服務同仁。
4. `query`：
   - 用 `appointmentId` 或 `phoneLast3 + line.userId` 查詢。
   - 查到資料時 Push 查詢成功 Flex。
   - 查不到資料時 Push 查無資料 Flex。
5. `cancel`：
   - 用 `appointmentId + line.userId` 查詢。
   - 更新狀態為 `cancelled`。
   - Push 取消成功 Flex 給民眾。
   - Push 取消通知 Flex 給服務同仁。
6. `Respond to Webhook` 回前端：

```json
{
  "ok": true,
  "message": "已送出，請回到 LINE 查看通知。"
}
```

## 可預約時段查詢回覆

前端選擇日期後會送出：

```json
{
  "action": "availability",
  "data": {
    "appointmentDate": "2026-04-24"
  }
}
```

n8n 應回傳：

```json
{
  "ok": true,
  "availableSlots": ["15:00", "15:15", "15:45", "16:00"],
  "bookedSlots": ["15:30", "16:15", "16:30", "16:45", "17:00"]
}
```

也可以回傳 `slots` 陣列：

```json
{
  "ok": true,
  "slots": [
    { "time": "15:00", "available": true },
    { "time": "15:15", "available": true },
    { "time": "15:30", "available": false }
  ]
}
```

若民眾送出預約時，該時段剛好已被其他人預約，建議 n8n 回：

```json
{
  "ok": false,
  "message": "此時段剛被預約，請改選其他可預約時段。",
  "availableSlots": ["15:45", "16:00"],
  "bookedSlots": ["15:00", "15:15", "15:30"]
}
```

HTTP status 請使用 `409 Conflict`。

## Flex Message 範本：民眾預約成功

```json
{
  "type": "flex",
  "altText": "法律諮詢預約成功",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#1F6F5F",
      "paddingAll": "16px",
      "contents": [
        {
          "type": "text",
          "text": "法律諮詢預約成功",
          "color": "#FFFFFF",
          "weight": "bold",
          "size": "lg"
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "md",
      "contents": [
        { "type": "text", "text": "您已預約成功，時間如下：", "wrap": true, "color": "#17352F" },
        {
          "type": "box",
          "layout": "vertical",
          "spacing": "sm",
          "contents": [
            { "type": "text", "text": "預約編號：{{appointmentId}}", "wrap": true },
            { "type": "text", "text": "陳情人：{{name}}", "wrap": true },
            { "type": "text", "text": "預約時間：{{appointmentDate}} {{appointmentTime}}", "wrap": true }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "color": "#2FA084",
          "action": {
            "type": "uri",
            "label": "查詢預約",
            "uri": "{{liffQueryUrl}}"
          }
        }
      ]
    }
  }
}
```

## Flex Message 範本：服務同仁新預約通知

```json
{
  "type": "flex",
  "altText": "新法律諮詢預約",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#2FA084",
      "paddingAll": "16px",
      "contents": [
        { "type": "text", "text": "新法律諮詢預約", "color": "#FFFFFF", "weight": "bold", "size": "lg" }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        { "type": "text", "text": "預約編號：{{appointmentId}}", "wrap": true },
        { "type": "text", "text": "姓名：{{name}}", "wrap": true },
        { "type": "text", "text": "電話：{{phone}}", "wrap": true },
        { "type": "text", "text": "時間：{{appointmentDate}} {{appointmentTime}}", "wrap": true },
        { "type": "separator", "margin": "md" },
        { "type": "text", "text": "事件陳述", "weight": "bold", "margin": "md" },
        { "type": "text", "text": "{{statement}}", "wrap": true, "color": "#5D716C" }
      ]
    }
  }
}
```

## Flex Message 範本：民眾預約資訊查詢成功

```json
{
  "type": "flex",
  "altText": "法律諮詢預約資訊",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#1F6F5F",
      "paddingAll": "16px",
      "contents": [
        { "type": "text", "text": "預約資訊查詢", "color": "#FFFFFF", "weight": "bold", "size": "lg" }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "md",
      "contents": [
        { "type": "text", "text": "您已預約成功，時間如下：", "wrap": true, "color": "#17352F" },
        { "type": "text", "text": "{{appointmentDate}} {{appointmentTime}}", "weight": "bold", "size": "xl", "color": "#2FA084", "wrap": true },
        { "type": "separator", "margin": "md" },
        { "type": "text", "text": "預約編號：{{appointmentId}}", "wrap": true },
        { "type": "text", "text": "陳情人：{{name}}", "wrap": true }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "style": "secondary",
          "action": {
            "type": "uri",
            "label": "取消預約",
            "uri": "{{liffCancelUrl}}"
          }
        }
      ]
    }
  }
}
```

## Flex Message 範本：查無預約資料

```json
{
  "type": "flex",
  "altText": "查無法律諮詢預約",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#EEEEEE",
      "paddingAll": "16px",
      "contents": [
        { "type": "text", "text": "查無預約資料", "color": "#17352F", "weight": "bold", "size": "lg" }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        { "type": "text", "text": "目前查不到符合條件的預約。", "wrap": true },
        { "type": "text", "text": "請確認預約編號或聯絡電話末三碼是否正確。", "wrap": true, "color": "#5D716C" }
      ]
    }
  }
}
```

## Flex Message 範本：民眾取消成功

```json
{
  "type": "flex",
  "altText": "法律諮詢預約已取消",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#1F6F5F",
      "paddingAll": "16px",
      "contents": [
        { "type": "text", "text": "預約已取消", "color": "#FFFFFF", "weight": "bold", "size": "lg" }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        { "type": "text", "text": "已收到您的取消預約申請。", "wrap": true },
        { "type": "text", "text": "原預約時間：{{appointmentDate}} {{appointmentTime}}", "wrap": true },
        { "type": "text", "text": "預約編號：{{appointmentId}}", "wrap": true }
      ]
    }
  }
}
```

## Flex Message 範本：服務同仁取消通知

```json
{
  "type": "flex",
  "altText": "民眾已取消法律諮詢預約",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#9F4C42",
      "paddingAll": "16px",
      "contents": [
        { "type": "text", "text": "民眾已取消預約", "color": "#FFFFFF", "weight": "bold", "size": "lg" }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        { "type": "text", "text": "預約編號：{{appointmentId}}", "wrap": true },
        { "type": "text", "text": "姓名：{{name}}", "wrap": true },
        { "type": "text", "text": "電話：{{phone}}", "wrap": true },
        { "type": "text", "text": "原預約時間：{{appointmentDate}} {{appointmentTime}}", "wrap": true },
        { "type": "text", "text": "取消原因：{{reason}}", "wrap": true }
      ]
    }
  }
}
```
