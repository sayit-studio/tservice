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
      { id: "reg-001", registrationId: "R20260001", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "林雅婷", phone: "0912-345-678", companions: 1, lineDisplayName: "婷婷", lineUserId: "U1a2b3c4d5e6f7a8b9c0d1e2f", status: "registered", createdAt: "2026-04-29T14:12:00+08:00", note: "" },
      { id: "reg-002", registrationId: "R20260002", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "陳建宏", phone: "0935-678-901", companions: 0, lineDisplayName: "阿宏", lineUserId: "U2b3c4d5e6f7a8b9c0d1e2f3a", status: "confirmed", createdAt: "2026-04-29T14:30:00+08:00", note: "" },
      { id: "reg-003", registrationId: "R20260003", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "王淑芬", phone: "0958-111-222", companions: 2, lineDisplayName: "淑芬媽", lineUserId: "U3c4d5e6f7a8b9c0d1e2f3a4b", status: "registered", createdAt: "2026-04-29T15:05:00+08:00", note: "需要輪椅通道" },
      { id: "reg-004", registrationId: "R20260004", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "黃志明", phone: "0977-333-444", companions: 0, lineDisplayName: "志明", lineUserId: "U4d5e6f7a8b9c0d1e2f3a4b5c", status: "cancelled", createdAt: "2026-04-29T15:20:00+08:00", note: "" },
      { id: "reg-005", registrationId: "R20260005", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "張美玲", phone: "0901-555-666", companions: 1, lineDisplayName: "美玲🌸", lineUserId: "U5e6f7a8b9c0d1e2f3a4b5c6d", status: "registered", createdAt: "2026-04-29T15:45:00+08:00", note: "" },
      { id: "reg-006", registrationId: "R20260006", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "李俊賢", phone: "0923-777-888", companions: 3, lineDisplayName: "俊賢", lineUserId: "U6f7a8b9c0d1e2f3a4b5c6d7e", status: "confirmed", createdAt: "2026-04-29T16:00:00+08:00", note: "一家四口" },
      { id: "reg-007", registrationId: "R20260007", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "吳佩珊", phone: "0946-999-000", companions: 0, lineDisplayName: "珊珊", lineUserId: "U7a8b9c0d1e2f3a4b5c6d7e8f", status: "registered", createdAt: "2026-04-29T16:20:00+08:00", note: "" },
      { id: "reg-008", registrationId: "R20260008", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "劉家豪", phone: "0969-123-456", companions: 1, lineDisplayName: "家豪", lineUserId: "U8b9c0d1e2f3a4b5c6d7e8f9a", status: "registered", createdAt: "2026-04-29T16:35:00+08:00", note: "" },
      { id: "reg-009", registrationId: "R20260009", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "蔡宜蓁", phone: "0988-234-567", companions: 0, lineDisplayName: "宜蓁💕", lineUserId: "U9c0d1e2f3a4b5c6d7e8f9a0b", status: "confirmed", createdAt: "2026-04-29T16:50:00+08:00", note: "" },
      { id: "reg-010", registrationId: "R20260010", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "許文彬", phone: "0912-876-543", companions: 2, lineDisplayName: "阿彬", lineUserId: "Ua0b1c2d3e4f5a6b7c8d9e0f1", status: "registered", createdAt: "2026-04-29T17:10:00+08:00", note: "攜帶長輩同行" },
      { id: "reg-011", registrationId: "R20260011", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "鄭雪華", phone: "0935-000-111", companions: 0, lineDisplayName: "雪華", lineUserId: "Ub1c2d3e4f5a6b7c8d9e0f1a2", status: "cancelled", createdAt: "2026-04-29T17:25:00+08:00", note: "" },
      { id: "reg-012", registrationId: "R20260012", eventId: "351b3ad1-d1cd-8134-8a3f-f33caa2d4235", name: "曾柏翰", phone: "0958-222-333", companions: 1, lineDisplayName: "柏翰", lineUserId: "Uc2d3e4f5a6b7c8d9e0f1a2b3", status: "registered", createdAt: "2026-04-29T17:40:00+08:00", note: "" }
    ],
    legal: [],
    members: [],
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
      const index = list.findIndex((item) => (payload.id && item.id === payload.id) || (payload.key && item.key === payload.key));
      if (index >= 0) {
        list[index] = { ...list[index], ...payload };
        return list[index];
      }
      const item = { ...payload, id: payload.id || `${collection}-${Date.now()}` };
      list.unshift(item);
      return item;
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
    async listCases(filters = {}) {
      if (config.useMockData) {
        const keyword = String(filters.caseNo || "").trim();
        const category = String(filters.category || "").trim();
        const status = String(filters.status || "").trim();
        const startDate = String(filters.startDate || "").trim();
        const endDate = String(filters.endDate || "").trim();
        return mock.cases.filter((item) => {
          const date = String(item.requestDate || item.startDate || item.createdAt || "").slice(0, 10);
          const keywordText = [item.caseNo, item.petitioner, item.phone, item.homePhone, item.email, item.content, item.summary, item.reply, item.staff, item.area, item.category].join(" ");
          return (!keyword || keywordText.includes(keyword))
            && (!category || item.category === category)
            && (!status || item.status === status)
            && (!startDate || date >= startDate)
            && (!endDate || date <= endDate);
        });
      }
      return post(config.endpoints.casesList, { action: "cases.list", filters });
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
    async listEventRegistrations(filters = {}) {
      if (config.useMockData) {
        const keyword = String(filters.keyword || filters.lineName || "").trim();
        const status = String(filters.status || "").trim();
        const startDate = String(filters.startDate || "").trim();
        const endDate = String(filters.endDate || "").trim();
        return mock.eventRegistrations.filter((item) => {
          const createdAt = String(item.createdAt || item.createdTime || "");
          const keywordText = [item.registrationId, item.name, item.phone, item.lineDisplayName, item.lineUserId].join(" ");
          return (!keyword || keywordText.includes(keyword))
            && (!status || item.status === status)
            && (!startDate || createdAt >= startDate)
            && (!endDate || createdAt <= endDate);
        });
      }
      return post(config.endpoints.eventRegistrationsList, { action: "eventRegistrations.list", filters });
    },
    async updateEventRegistration(payload) {
      if (config.useMockData) return mutateMock("eventRegistrations", "update", payload);
      return post(config.endpoints.eventRegistrationsList, { action: "eventRegistrations.update", data: payload });
    },
    async listLegalConsultations() {
      return config.useMockData ? mock.legal : post(config.endpoints.legalList, { action: "legal.list" });
    },
    async getLegalSlotSettings() {
      if (config.useMockData) return { disabledSlots: [] };
      return post(config.endpoints.legalList, { action: "legal.slotSettings.get" });
    },
    async saveLegalSlotSettings(payload) {
      if (config.useMockData) return payload;
      return post(config.endpoints.legalList, { action: "legal.slotSettings.save", data: payload });
    },
    async saveLegalConsultation(payload) {
      if (config.useMockData) return mutateMock("legal", payload.id ? "update" : "create", payload);
      return post(config.endpoints.legalList, { action: payload.id ? "legal.update" : "legal.create", data: payload });
    },
    async deleteLegalConsultation(id) {
      if (config.useMockData) return mutateMock("legal", "delete", { id });
      return post(config.endpoints.legalList, { action: "legal.delete", id });
    },
    async listMembers() {
      return config.useMockData ? (mock.members || []) : post(config.endpoints.membersList, { action: "members.list" });
    },
    async saveMember(payload) {
      if (config.useMockData) return mutateMock("members", "update", payload);
      return post(config.endpoints.membersList, { action: "members.update", data: payload });
    },
    async listLineAccounts() {
      return config.useMockData ? mock.lineAccounts : post(config.endpoints.lineAccounts, { action: "lineAccounts.list" });
    },
    async saveLineAccount(payload) {
      if (config.useMockData) return mutateMock("lineAccounts", "update", payload);
      return post(config.endpoints.lineAccounts, { action: "lineAccounts.update", data: payload });
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
