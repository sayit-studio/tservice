(function () {
  const config = window.EVENT_REGISTRATION_CONFIG || {};
  const params = new URLSearchParams(window.location.search);

  function readEventId() {
    const direct = params.get("eventId");
    if (direct) return direct;

    const liffState = params.get("liff.state");
    if (!liffState) return "";

    try {
      const normalized = liffState.startsWith("?") ? liffState.slice(1) : liffState;
      return new URLSearchParams(normalized).get("eventId") || "";
    } catch (_) {
      return "";
    }
  }

  function readParamFromUrlOrLiffState(names) {
    for (const name of names) {
      const direct = params.get(name);
      if (direct) return direct;
    }

    const liffState = params.get("liff.state");
    if (!liffState) return "";

    try {
      const normalized = liffState.startsWith("?") ? liffState.slice(1) : liffState;
      const stateParams = new URLSearchParams(normalized);
      for (const name of names) {
        const value = stateParams.get(name);
        if (value) return value;
      }
    } catch (_) {
      return "";
    }

    return "";
  }

  const state = {
    liffReady: false,
    profile: null,
    eventId: readEventId(),
    eventName: readParamFromUrlOrLiffState(["eventName", "eventTitle", "title"]),
    eventDate: readParamFromUrlOrLiffState(["eventDate", "eventTime", "date", "time"])
  };

  const eventNamePill = document.getElementById("eventNamePill");
  const eventNameText = document.getElementById("eventNameText");
  const eventDateText = document.getElementById("eventDateText");
  const noticeEl = document.getElementById("notice");
  const form = document.getElementById("registrationForm");
  const completeLayer = document.getElementById("completeLayer");
  const completeText = document.getElementById("completeText");
  const closeButton = document.getElementById("closeButton");

  function showNotice(message, tone) {
    noticeEl.textContent = displayMessage(message);
    noticeEl.dataset.tone = tone || "info";
    noticeEl.hidden = false;
  }

  function hideNotice() {
    noticeEl.hidden = true;
    noticeEl.textContent = "";
  }

  function setValue(id, value) {
    document.getElementById(id).value = value || "";
  }

  function displayMessage(message) {
    return String(message || "").replace(/報名/g, "簽到");
  }

  function readableMessage(message, fallback) {
    const text = displayMessage(message).trim();
    return !text || /^\?+$/.test(text) ? fallback : text;
  }

  function hasMemberWebhook() {
    return Boolean(config.memberWebhookBaseUrl && !config.memberWebhookBaseUrl.includes("YOUR_N8N_DOMAIN"));
  }

  async function captureMember(stage, extraData = {}) {
    const profile = state.profile || {};
    const lineUserId = document.getElementById("lineUserId").value.trim() || profile.userId || "";
    if (!hasMemberWebhook() || !lineUserId) return;

    try {
      await fetch(config.memberWebhookBaseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "member.bind",
          source: "line-liff",
          submittedAt: new Date().toISOString(),
          data: {
            lineUserId,
            displayName: document.getElementById("lineDisplayName").value.trim() || profile.displayName || "",
            sourcePage: "event-registration",
            stage,
            tags: ["LIFF 綁定", "活動簽到"],
            ...extraData
          }
        })
      });
    } catch (_) {
      // Member capture should not block public registration.
    }
  }

  async function initLiff() {
    setValue("eventId", state.eventId);
    if (state.eventName || state.eventDate) {
      eventNameText.textContent = state.eventName || "活動場次";
      eventDateText.textContent = state.eventDate || "";
      eventDateText.hidden = !state.eventDate;
      eventNamePill.hidden = false;
    }

    if (!window.liff || !config.liffId || config.liffId.includes("請填入")) {
      showNotice("尚未設定 LIFF ID，目前只能測試表單送出，無法取得 LINE 使用者資料。", "info");
      return;
    }

    try {
      await liff.init({ liffId: config.liffId });
      state.liffReady = true;
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }
      const profile = await liff.getProfile();
      state.profile = profile;
      setValue("lineUserId", profile.userId);
      setValue("lineDisplayName", profile.displayName);
      captureMember("event_liff_open");
    } catch (error) {
      showNotice("LIFF 初始化失敗，請確認 LIFF ID 與 Endpoint URL。", "error");
    }
  }

  function formToObject() {
    return Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value]) => [key, String(value).trim()]));
  }

  async function submitRegistration(event) {
    event.preventDefault();
    hideNotice();
    const button = form.querySelector("button[type='submit']");
    let keepButtonDisabled = false;
    button.disabled = true;
    button.textContent = "送出中";

    try {
      const payload = {
        action: "event.register",
        source: "line-liff",
        submittedAt: new Date().toISOString(),
        data: {
          ...formToObject(),
          liffLanguage: window.liff?.getLanguage ? liff.getLanguage() : "",
          liffOS: window.liff?.getOS ? liff.getOS() : "",
          isInClient: window.liff?.isInClient ? liff.isInClient() : false
        }
      };
      await captureMember("event_registration_submit", {
        name: payload.data.name,
        phone: payload.data.phone,
        note: payload.data.note,
        tags: ["LIFF 綁定", "活動簽到", "已填聯絡資料"]
      });
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), Number(config.submitTimeoutMs) || 15000);
      const response = await fetch(config.webhookBaseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);
      const body = await response.json().catch(() => ({}));
      if (response.status === 409 || body.duplicate === true) {
        keepButtonDisabled = true;
        button.textContent = "今日已簽到";
        throw new Error(readableMessage(body.message, "今天已經完成簽到，請勿重複簽到。"));
      }
      if (!response.ok || body.ok === false) throw new Error(readableMessage(body.message, "簽到送出失敗"));
      completeText.textContent = readableMessage(body.message, "簽到已送出，服務團隊已收到您的簽到資料。");
      completeLayer.hidden = false;
      window.setTimeout(closeWindow, Number(config.closeDelayMs) || 1400);
    } catch (error) {
      const message = error.name === "AbortError" ? "簽到送出逾時，請稍後再試或通知服務人員檢查 n8n。" : error.message;
      showNotice(readableMessage(message, "簽到送出失敗，請稍後再試。"), "error");
    } finally {
      if (!keepButtonDisabled) {
        button.disabled = false;
        button.textContent = "送出簽到";
      }
    }
  }

  function closeWindow() {
    if (window.liff && state.liffReady && liff.isInClient()) {
      liff.closeWindow();
      return;
    }
    completeLayer.hidden = true;
  }

  form.addEventListener("submit", submitRegistration);
  closeButton.addEventListener("click", closeWindow);
  initLiff();
})();
