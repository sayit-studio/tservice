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

  const state = {
    liffReady: false,
    eventId: readEventId()
  };

  const statusEl = document.getElementById("liffStatus");
  const noticeEl = document.getElementById("notice");
  const form = document.getElementById("registrationForm");
  const completeLayer = document.getElementById("completeLayer");
  const completeText = document.getElementById("completeText");
  const closeButton = document.getElementById("closeButton");
  const profileBox = document.getElementById("profileBox");
  const profileName = document.getElementById("profileName");
  const profileId = document.getElementById("profileId");

  function setStatus(text, tone) {
    statusEl.textContent = text;
    statusEl.dataset.tone = tone || "";
  }

  function showNotice(message, tone) {
    noticeEl.textContent = message;
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

  async function initLiff() {
    setValue("eventId", state.eventId);
    if (!state.eventId) {
      showNotice("缺少活動編號，請重新開啟報名連結。", "error");
      form.querySelector("button[type='submit']").disabled = true;
      return;
    }

    if (!window.liff || !config.liffId || config.liffId.includes("請填入")) {
      setStatus("未設定 LIFF", "warn");
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
      profileName.textContent = profile.displayName || "未命名";
      profileId.textContent = profile.userId || "";
      profileBox.hidden = false;
      setStatus("LINE 已連線", "success");
    } catch (error) {
      setStatus("LINE 連線失敗", "error");
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
      if (!response.ok || body.ok === false) throw new Error(body.message || "報名送出失敗");
      completeText.textContent = body.message || "服務團隊已收到您的報名資料。";
      completeLayer.hidden = false;
      window.setTimeout(closeWindow, Number(config.closeDelayMs) || 1400);
    } catch (error) {
      showNotice(error.message || "報名送出失敗，請稍後再試。", "error");
    } finally {
      button.disabled = false;
      button.textContent = "送出報名";
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
