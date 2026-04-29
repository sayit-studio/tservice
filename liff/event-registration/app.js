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

  async function initLiff() {
    setValue("eventId", state.eventId);
    if (state.eventName || state.eventDate) {
      eventNameText.textContent = state.eventName || "活動場次";
      eventDateText.textContent = state.eventDate || "";
      eventDateText.hidden = !state.eventDate;
      eventNamePill.hidden = false;
    }

    if (!state.eventId) {
      showNotice("缺少活動編號，請重新開啟簽到連結。", "error");
      form.querySelector("button[type='submit']").disabled = true;
      return;
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
      setValue("lineUserId", profile.userId);
      setValue("lineDisplayName", profile.displayName);
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
      const response = await fetch(config.webhookBaseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.ok === false) throw new Error(body.message || "簽到送出失敗");
      completeText.textContent = displayMessage(body.message) || "服務團隊已收到您的簽到資料。";
      completeLayer.hidden = false;
      window.setTimeout(closeWindow, Number(config.closeDelayMs) || 1400);
    } catch (error) {
      showNotice(error.message || "簽到送出失敗，請稍後再試。", "error");
    } finally {
      button.disabled = false;
      button.textContent = "送出簽到";
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
