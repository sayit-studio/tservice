(function () {
  const config = window.ADMIN_CONFIG || {};

  function readableErrorMessage(message, fallback) {
    const text = String(message || "").trim();
    if (!text || /^\?+$/.test(text)) return fallback;
    return text;
  }

  async function post(endpoint, payload) {
    if (!config.webhookBaseUrl) {
      throw new Error("尚未設定 n8n webhookBaseUrl");
    }
    const response = await fetch(`${config.webhookBaseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(readableErrorMessage(body.message, "帳號或密碼錯誤"));
    if (body && body.ok === false) throw new Error(readableErrorMessage(body.message, "n8n 回傳失敗"));
    return body.data || body;
  }

  const mock = {
    users: [],
    cases: [],
    events: [],
    eventRegistrations: [
      { id: "reg-001", registrationId: "R20260001", eventId: "LIFFhk4g4", name: "林雅婷", phone: "0912-345-678", companions: 1, lineDisplayName: "婷婷", lineUserId: "U1a2b3c4d5e6f7a8b9c0d1e2f", status: "registered", createdAt: "2026-04-20T09:12:00+08:00", note: "" },
      { id: "reg-002", registrationId: "R20260002", eventId: "LIFFhk4g4", name: "陳建宏", phone: "0935-678-901", companions: 0, lineDisplayName: "阿宏", lineUserId: "U2b3c4d5e6f7a8b9c0d1e2f3a", status: "confirmed", createdAt: "2026-04-20T10:30:00+08:00", note: "" },
      { id: "reg-003", registrationId: "R20260003", eventId: "LIFFhk4g4", name: "王淑芬", phone: "0958-111-222", companions: 2, lineDisplayName: "淑芬媽", lineUserId: "U3c4d5e6f7a8b9c0d1e2f3a4b", status: "registered", createdAt: "2026-04-20T11:05:00+08:00", note: "需要輪椅通道" },
      { id: "reg-004", registrationId: "R20260004", eventId: "LIFFhk4g4", name: "黃志明", phone: "0977-333-444", companions: 0, lineDisplayName: "志明", lineUserId: "U4d5e6f7a8b9c0d1e2f3a4b5c", status: "cancelled", createdAt: "2026-04-21T08:45:00+08:00", note: "" },
      { id: "reg-005", registrationId: "R20260005", eventId: "LIFFhk4g4", name: "張美玲", phone: "0901-555-666", companions: 1, lineDisplayName: "美玲🌸", lineUserId: "U5e6f7a8b9c0d1e2f3a4b5c6d", status: "registered", createdAt: "2026-04-21T13:20:00+08:00", note: "" },
      { id: "reg-006", registrationId: "R20260006", eventId: "LIFFhk4g4", name: "李俊賢", phone: "0923-777-888", companions: 3, lineDisplayName: "俊賢", lineUserId: "U6f7a8b9c0d1e2f3a4b5c6d7e", status: "confirmed", createdAt: "2026-04-22T09:00:00+08:00", note: "一家四口" },
      { id: "reg-007", registrationId: "R20260007", eventId: "LIFFhk4g4", name: "吳佩珊", phone: "0946-999-000", companions: 0, lineDisplayName: "珊珊", lineUserId: "U7a8b9c0d1e2f3a4b5c6d7e8f", status: "registered", createdAt: "2026-04-22T14:10:00+08:00", note: "" },
      { id: "reg-008", registrationId: "R20260008", eventId: "LIFFhk4g4", name: "劉家豪", phone: "0969-123-456", companions: 1, lineDisplayName: "家豪", lineUserId: "U8b9c0d1e2f3a4b5c6d7e8f9a", status: "registered", createdAt: "2026-04-23T10:55:00+08:00", note: "" },
      { id: "reg-009", registrationId: "R20260009", eventId: "LIFFhk4g4", name: "蔡宜蓁", phone: "0988-234-567", companions: 0, lineDisplayName: "宜蓁💕", lineUserId: "U9c0d1e2f3a4b5c6d7e8f9a0b", status: "confirmed", createdAt: "2026-04-24T08:30:00+08:00", note: "" },
      { id: "reg-010", registrationId: "R20260010", eventId: "LIFFhk4g4", name: "許文彬", phone: "0912-876-543", companions: 2, lineDisplayName: "阿彬", lineUserId: "Ua0b1c2d3e4f5a6b7c8d9e0f1", status: "registered", createdAt: "2026-04-24T15:40:00+08:00", note: "攜帶長輩同行" },
      { id: "reg-011", registrationId: "R20260011", eventId: "LIFFhk4g4", name: "鄭雪華", phone: "0935-000-111", companions: 0, lineDisplayName: "雪華", lineUserId: "Ub1c2d3e4f5a6b7c8d9e0f1a2", status: "cancelled", createdAt: "2026-04-25T09:15:00+08:00", note: "" },
      { id: "reg-012", registrationId: "R20260012", eventId: "LIFFhk4g4", name: "曾柏翰", phone: "0958-222-333", companions: 1, lineDisplayName: "柏翰", lineUserId: "Uc2d3e4f5a6b7c8d9e0f1a2b3", status: "registered", createdAt: "2026-04-25T11:30:00+08:00", note: "" }
    ],
    legal: [],
    staff: []
  };

  function mutateMock(collection, action, payload) {
    const list = mock[collection];
    if (action === "create") {
      const item = { ...payload, id: `${collection}-${Date.now()}` };
      list.unshift(item);
      return item;
    }
    if (action === "update") {
      const index = list.findIndex((item) => item.id === payload.id);
      if (index >= 0) list[index] = { ...list[index], ...payload };
      return list[index];
    }
    if (action === "delete") {
      const index = list.findIndex((item) => item.id === payload.id);
      if (index >= 0) list.splice(index, 1);
      return { ok: true };
    }
    return null;
  }

  window.AdminApi = {
    async login(account, password) {
      if (config.useMockData) {
        const user = mock.users.find((item) => item.account === account && item.password === password);
        if (!user) throw new Error("帳號或密碼錯誤");
        return { ...user, password: undefined };
      }
      return post(config.endpoints.login, { action: "login", account, password });
    },
    async listCases() {
      return config.useMockData ? mock.cases : post(config.endpoints.casesList, { action: "cases.list" });
    },
    async saveCase(payload) {
      if (config.useMockData) return mutateMock("cases", payload.id ? "update" : "create", payload);
      return post(config.endpoints.casesList, { action: payload.id ? "cases.update" : "cases.create", data: payload });
    },
    async deleteCase(id) {
      if (config.useMockData) return mutateMock("cases", "delete", { id });
      return post(config.endpoints.casesList, { action: "cases.delete", id });
    },
    async listEvents() {
      return config.useMockData ? mock.events : post(config.endpoints.eventsList, { action: "events.list" });
    },
    async saveEvent(payload) {
      if (config.useMockData) return mutateMock("events", payload.id ? "update" : "create", payload);
      return post(config.endpoints.eventsList, { action: payload.id ? "events.update" : "events.create", data: payload });
    },
    async deleteEvent(id) {
      if (config.useMockData) return mutateMock("events", "delete", { id });
      return post(config.endpoints.eventsList, { action: "events.delete", id });
    },
    async listEventRegistrations(eventId) {
      if (config.useMockData) {
        return mock.eventRegistrations.filter((item) => !eventId || item.eventId === eventId);
      }
      return post(config.endpoints.eventRegistrationsList, { action: "eventRegistrations.list", eventId });
    },
    async listLegalConsultations() {
      return config.useMockData ? mock.legal : post(config.endpoints.legalList, { action: "legal.list" });
    },
    async saveLegalConsultation(payload) {
      if (config.useMockData) return mutateMock("legal", payload.id ? "update" : "create", payload);
      return post(config.endpoints.legalList, { action: payload.id ? "legal.update" : "legal.create", data: payload });
    },
    async deleteLegalConsultation(id) {
      if (config.useMockData) return mutateMock("legal", "delete", { id });
      return post(config.endpoints.legalList, { action: "legal.delete", id });
    },
    async listStaff() {
      return config.useMockData ? mock.staff : post(config.endpoints.staffList, { action: "staff.list" });
    },
    async saveStaff(payload) {
      if (config.useMockData) return mutateMock("staff", payload.id ? "update" : "create", payload);
      return post(config.endpoints.staffList, { action: payload.id ? "staff.update" : "staff.create", data: payload });
    },
    async deleteStaff(id) {
      if (config.useMockData) return mutateMock("staff", "delete", { id });
      return post(config.endpoints.staffList, { action: "staff.delete", id });
    }
  };
})();
