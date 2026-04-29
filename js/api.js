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
    eventRegistrations: [],
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
