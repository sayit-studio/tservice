(function () {
  const config = window.APP_CONFIG || {};
  const state = {
    mode: new URLSearchParams(window.location.search).get("mode") || "book",
    liffReady: false,
    profile: null,
    availabilityByDate: {}
  };

  const statusEl = document.getElementById("liffStatus");
  const noticeEl = document.getElementById("notice");
  const completeLayer = document.getElementById("completeLayer");
  const completeTitle = document.getElementById("completeTitle");
  const completeText = document.getElementById("completeText");
  const closeButton = document.getElementById("closeButton");
  const appointmentDate = document.getElementById("appointmentDate");
  const appointmentTime = document.getElementById("appointmentTime");
  const availabilitySummary = document.getElementById("availabilitySummary");
  const tabs = Array.from(document.querySelectorAll(".mode-tab"));
  const forms = Array.from(document.querySelectorAll("[data-form]"));

  const LEGAL_ITEM_MAP = {
    "\u6c11\u4e8b": ["\u6c11\u4e8b\uff1a\u8eca\u798d", "\u6c11\u4e8b\uff1a\u50b5\u6b0a\u50b5\u52d9", "\u6c11\u4e8b\uff1a\u4e0d\u52d5\u7522", "\u6c11\u4e8b\uff1a\u5408\u7d04\u7cfe\u7d1b", "\u6c11\u4e8b\uff1a\u5176\u5b83"],
    "\u5211\u4e8b": ["\u5211\u4e8b\uff1a\u8a50\u6b3a", "\u5211\u4e8b\uff1a\u80cc\u4fe1", "\u5211\u4e8b\uff1a\u507d\u9020\u6587\u66f8", "\u5211\u4e8b\uff1a\u6bd2\u54c1", "\u5211\u4e8b\uff1a\u59a8\u7919\u81ea\u7531", "\u5211\u4e8b\uff1a\u5176\u5b83"],
    "\u884c\u653f\u8a34\u8a1f": ["\u884c\u653f\u8a34\u8a1f\uff1a\u4ea4\u901a\u88c1\u7f70", "\u884c\u653f\u8a34\u8a1f\uff1a\u7a05\u52d9", "\u884c\u653f\u8a34\u8a1f\uff1a\u570b\u8ce0", "\u884c\u653f\u8a34\u8a1f\uff1a\u516c\u52d9\u54e1\u7533\u8a34", "\u884c\u653f\u8a34\u8a1f\uff1a\u5176\u5b83"],
    "\u5bb6\u4e8b": ["\u5bb6\u4e8b\uff1a\u96e2\u5a5a", "\u5bb6\u4e8b\uff1a\u76e3\u8b77\u6b0a", "\u5bb6\u4e8b\uff1a\u7e7c\u627f", "\u5bb6\u4e8b\uff1a\u89aa\u5b50\u7cfe\u7d1b", "\u5bb6\u4e8b\uff1a\u5176\u5b83"],
    "\u52de\u8cc7\u7cfe\u7d1b": ["\u52de\u8cc7\u7cfe\u7d1b\uff1a\u8077\u696d\u50b7\u5bb3", "\u52de\u8cc7\u7cfe\u7d1b\uff1a\u85aa\u8cc7", "\u52de\u8cc7\u7cfe\u7d1b\uff1a\u8077\u707d", "\u52de\u8cc7\u7cfe\u7d1b\uff1a\u5176\u5b83"],
    "\u6d88\u8cbb\u7cfe\u7d1b": ["\u6d88\u8cbb\u7cfe\u7d1b\uff1a\u7db2\u8def\u8cfc\u7269", "\u6d88\u8cbb\u7cfe\u7d1b\uff1a\u79df\u8cc3\u5408\u7d04", "\u6d88\u8cbb\u7cfe\u7d1b\uff1a\u91ab\u7642\u7cfe\u7d1b"],
    "\u5f37\u5236\u57f7\u884c": ["\u5f37\u5236\u57f7\u884c\uff1a\u8072\u8acb\u5047\u6263\u62bc", "\u5f37\u5236\u57f7\u884c\uff1a\u5047\u8655\u5206", "\u5f37\u5236\u57f7\u884c\uff1a\u8655\u7406\u50b5\u52d9\u6e05\u511f", "\u5f37\u5236\u57f7\u884c\uff1a\u5176\u5b83"]
  };

  const legalCategory = document.getElementById("legalCategory");
  const legalItem = document.getElementById("legalItem");
  const legalOtherField = document.getElementById("legalOtherField");

  const actionLabels = {
    book: "立即預約",
    query: "預約資訊查詢",
    cancel: "取消預約"
  };

  function setStatus(text, tone) {
    statusEl.textContent = text;
    statusEl.dataset.tone = tone || "neutral";
  }

  function showNotice(message, tone) {
    noticeEl.textContent = message;
    noticeEl.dataset.tone = tone || "info";
    noticeEl.hidden = false;
  }

  function setAvailabilitySummary(message, tone) {
    availabilitySummary.textContent = message;
    availabilitySummary.dataset.tone = tone || "info";
  }

  function hideNotice() {
    noticeEl.hidden = true;
    noticeEl.textContent = "";
  }

  function setMode(mode) {
    state.mode = ["book", "query", "cancel"].includes(mode) ? mode : "book";
    tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === state.mode));
    forms.forEach((form) => {
      form.hidden = form.dataset.form !== state.mode;
    });
    hideNotice();

    const params = new URLSearchParams(window.location.search);
    params.set("mode", state.mode);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }

  function toLocalDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function isWeekday(dateString) {
    const day = new Date(`${dateString}T00:00:00`).getDay();
    return day >= 1 && day <= 5;
  }

  function buildTimeSlots() {
    const slots = [];
    const startHour = Number(config.bookingStartHour || 15);
    const endHour = Number(config.bookingEndHour || 17);
    const endMinute = Number(config.bookingEndMinute || 0);
    const intervalMinutes = Number(config.bookingIntervalMinutes || 15);
    const cursor = new Date(2000, 0, 1, startHour, 0, 0, 0);
    const end = new Date(2000, 0, 1, endHour, endMinute, 0, 0);

    while (cursor <= end) {
      const hour = String(cursor.getHours()).padStart(2, "0");
      const minute = String(cursor.getMinutes()).padStart(2, "0");
      slots.push(`${hour}:${minute}`);
      cursor.setMinutes(cursor.getMinutes() + intervalMinutes);
    }
    return slots;
  }

  function hasConfiguredWebhook() {
    return config.enableAvailabilityLookup !== false && Boolean(config.webhookBaseUrl && !config.webhookBaseUrl.includes("your-n8n-domain.example"));
  }

  function hasMemberWebhook() {
    return Boolean(config.memberWebhookBaseUrl && !config.memberWebhookBaseUrl.includes("YOUR_N8N_DOMAIN"));
  }

  async function captureMember(stage, formData = {}) {
    const profile = state.profile || {};
    const lineUserId = profile.userId || formData.lineUserId || "";
    if (!hasMemberWebhook() || !lineUserId) return;

    const tags = ["LIFF 綁定", "法扶諮詢"];
    if (stage === "legal_book_submit") tags.push("已填聯絡資料");
    if (stage === "legal_query_submit") tags.push("預約查詢");
    if (stage === "legal_cancel_submit") tags.push("預約取消");

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
            displayName: profile.displayName || "",
            name: formData.name || "",
            phone: formData.phone || "",
            sourcePage: "legal-consultation",
            stage,
            tags
          }
        })
      });
    } catch (_) {
      // Member capture should not block legal consultation workflows.
    }
  }

  function normalizeAvailability(body) {
    const allSlots = buildTimeSlots();

    if (Array.isArray(body.slots)) {
      const availableSlots = body.slots.filter((slot) => slot.available !== false).map((slot) => slot.time);
      const bookedSlots = body.slots.filter((slot) => slot.available === false).map((slot) => slot.time);
      return { availableSlots, bookedSlots };
    }

    return {
      availableSlots: Array.isArray(body.availableSlots) ? body.availableSlots : allSlots,
      bookedSlots: Array.isArray(body.bookedSlots) ? body.bookedSlots : []
    };
  }

  function renderTimeOptions(availability) {
    const allSlots = buildTimeSlots();
    const available = new Set(availability.availableSlots || []);
    const booked = new Set(availability.bookedSlots || []);

    appointmentTime.innerHTML = "";
    appointmentTime.append(new Option("請選擇時間", ""));

    allSlots.forEach((time) => {
      const isAvailable = available.has(time) && !booked.has(time);
      const label = isAvailable ? time : `${time} 已額滿`;
      const option = new Option(label, isAvailable ? time : "");
      option.disabled = !isAvailable;
      appointmentTime.append(option);
    });

    const count = allSlots.filter((time) => available.has(time) && !booked.has(time)).length;
    if (count > 0) {
      setAvailabilitySummary(`目前此日期尚有 ${count} 個可預約時段。`, "success");
      return;
    }
    setAvailabilitySummary("此日期目前已無可預約時段，請選擇其他日期。", "error");
  }

  async function fetchAvailability(dateValue) {
    if (!hasConfiguredWebhook()) {
      return { availableSlots: buildTimeSlots(), bookedSlots: [] };
    }

    const body = await submitToN8n({
      action: "availability",
      actionLabel: "查詢可預約時段",
      source: "line-liff",
      submittedAt: new Date().toISOString(),
      data: { appointmentDate: dateValue }
    });

    return normalizeAvailability(body);
  }

  async function refreshTimeOptions() {
    const dateValue = appointmentDate.value;
    appointmentTime.innerHTML = "";

    if (!dateValue) {
      appointmentTime.append(new Option("請先選擇日期", ""));
      setAvailabilitySummary("選擇日期後會顯示可預約時段。", "info");
      return;
    }

    if (!isWeekday(dateValue)) {
      appointmentTime.append(new Option("僅開放週一至週五", ""));
      appointmentTime.value = "";
      setAvailabilitySummary("週六、週日不開放預約。", "error");
      showNotice("預約日期僅開放週一至週五，請重新選擇。", "error");
      return;
    }

    appointmentTime.append(new Option("讀取可預約時段中", ""));
    appointmentTime.disabled = true;
    setAvailabilitySummary("正在查詢目前可預約時段。", "info");

    try {
      const availability = await fetchAvailability(dateValue);
      state.availabilityByDate[dateValue] = availability;
      renderTimeOptions(availability);
    } catch (error) {
      appointmentTime.innerHTML = "";
      appointmentTime.append(new Option("無法取得可預約時段", ""));
      setAvailabilitySummary("暫時無法查詢可預約時段，請稍後再試。", "error");
      showNotice(error.message || "暫時無法查詢可預約時段，請稍後再試。", "error");
    } finally {
      appointmentTime.disabled = false;
    }
  }

  function setupBookingCalendar() {
    const today = new Date();
    appointmentDate.min = toLocalDateInputValue(today);
    refreshTimeOptions();
  }

  function updateLegalItems() {
    if (!legalCategory || !legalItem) return;
    const items = LEGAL_ITEM_MAP[legalCategory.value] || [];
    legalItem.innerHTML = "";
    legalItem.append(new Option(items.length ? "\u8acb\u9078\u64c7\u7d30\u9805" : "\u8acb\u5148\u9078\u64c7\u6cd5\u6276\u9805\u76ee", ""));
    items.forEach((item) => legalItem.append(new Option(item, item)));
    if (legalOtherField) legalOtherField.hidden = true;
  }

  function toggleLegalOther() {
    if (!legalOtherField || !legalItem) return;
    legalOtherField.hidden = !legalItem.value.includes("??");
  }

  function formToObject(form) {
    const data = new FormData(form);
    return Object.fromEntries(Array.from(data.entries()).map(([key, value]) => [key, String(value).trim()]));
  }

  function validatePayload(payload, mode) {
    if (mode === "book" && !isWeekday(payload.appointmentDate)) {
      return "預約日期僅開放週一至週五。";
    }
    if (mode === "book" && (!payload.legalCategory || !payload.legalItem)) {
      return "???????????";
    }
    if (mode === "book") {
      const availability = state.availabilityByDate[payload.appointmentDate];
      if (availability && !availability.availableSlots.includes(payload.appointmentTime)) {
        return "此時段目前已額滿，請改選其他可預約時段。";
      }
    }
    if (mode === "query" && !payload.appointmentId) {
      return "請填寫預約編號。";
    }
    return "";
  }

  function buildPayload(mode, form) {
    const profile = state.profile || {};
    return {
      action: mode,
      actionLabel: actionLabels[mode],
      source: "line-liff",
      submittedAt: new Date().toISOString(),
      teamLineTarget: config.teamLineTarget || "",
      data: {
        ...formToObject(form),
        lineUserId: profile.userId || "",
        lineDisplayName: profile.displayName || ""
      }
    };
  }

  async function submitToN8n(payload) {
    const response = await fetch(config.webhookBaseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let body = {};
    try {
      body = await response.json();
    } catch (_) {
      body = {};
    }

    if (!response.ok) {
      const error = new Error(body.message || "系統暫時無法處理，請稍後再試。");
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }

  function finishFlow(title, text) {
    completeTitle.textContent = title;
    completeText.textContent = text;
    completeLayer.hidden = false;

    window.setTimeout(() => {
      closeLiffWindow();
    }, Number(config.closeDelayMs) || 1400);
  }

  function closeLiffWindow() {
    if (window.liff && state.liffReady && liff.isInClient()) {
      liff.closeWindow();
      return;
    }
    showNotice("此頁面已完成送出。", "success");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const mode = form.dataset.form;
    const submitButton = form.querySelector("button[type='submit']");
    const payloadData = formToObject(form);
    const validationMessage = validatePayload(payloadData, mode);

    if (validationMessage) {
      showNotice(validationMessage, "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "處理中";
    hideNotice();

    try {
      const payload = buildPayload(mode, form);
      await captureMember(`legal_${mode}_submit`, payload.data);
      const result = await submitToN8n(payload);
      const titleMap = {
        book: "預約已送出",
        query: "查詢已送出",
        cancel: "取消申請已送出"
      };
      const fallbackText = "系統已收到資料。";
      finishFlow(titleMap[mode], result.message || fallbackText);
    } catch (error) {
      if (mode === "book" && error.status === 409 && payloadData.appointmentDate) {
        showNotice(error.message || "此時段剛被預約，請改選其他可預約時段。", "error");
        await refreshTimeOptions();
        return;
      }
      showNotice(error.message || "送出失敗，請稍後再試。", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = mode === "book" ? "送出預約" : mode === "query" ? "查詢預約" : "取消預約";
    }
  }

  async function initLiff() {
    if (!window.liff || !config.liffId || config.liffId.includes("請填入")) {
      setStatus("本機預覽", "warn");
      showNotice("尚未設定 LIFF ID，目前可先測試表單畫面與 n8n 送出格式。", "info");
      return;
    }

    try {
      await liff.init({ liffId: config.liffId });
      state.liffReady = true;
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }
      state.profile = await liff.getProfile();
      captureMember("legal_liff_open");
      setStatus("表單已就緒", "success");
    } catch (error) {
      setStatus("LINE 連線失敗", "error");
      showNotice("LIFF 初始化失敗，請確認 LIFF ID、Endpoint URL 與 LINE Login 設定。", "error");
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  forms.forEach((form) => {
    form.addEventListener("submit", handleSubmit);
  });

  appointmentDate.addEventListener("change", refreshTimeOptions);
  if (legalCategory) legalCategory.addEventListener("change", updateLegalItems);
  if (legalItem) legalItem.addEventListener("change", toggleLegalOther);
  closeButton.addEventListener("click", closeLiffWindow);

  updateLegalItems();
  setupBookingCalendar();
  setMode(state.mode);
  initLiff();
})();
