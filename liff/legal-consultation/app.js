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
  const legalCategory = document.getElementById("legalCategory");
  const legalItem = document.getElementById("legalItem");
  const legalOtherField = document.getElementById("legalOtherField");
  const tabs = Array.from(document.querySelectorAll(".mode-tab"));
  const forms = Array.from(document.querySelectorAll("[data-form]"));

  const LEGAL_ITEM_MAP = {
    "民事": ["民事：車禍", "民事：債權債務", "民事：不動產", "民事：合約糾紛", "民事：其它"],
    "刑事": ["刑事：詐欺", "刑事：背信", "刑事：偽造文書", "刑事：毒品", "刑事：妨礙自由", "刑事：其它"],
    "行政訴訟": ["行政訴訟：交通裁罰", "行政訴訟：稅務", "行政訴訟：國賠", "行政訴訟：公務員申訴", "行政訴訟：其它"],
    "家事": ["家事：離婚", "家事：監護權", "家事：繼承", "家事：親子糾紛", "家事：其它"],
    "勞資糾紛": ["勞資糾紛：職業傷害", "勞資糾紛：薪資", "勞資糾紛：職災", "勞資糾紛：其它"],
    "消費糾紛": ["消費糾紛：網路購物", "消費糾紛：租賃合約", "消費糾紛：醫療糾紛"],
    "強制執行": ["強制執行：聲請假扣押", "強制執行：假處分", "強制執行：處理債務清償", "強制執行：其它"]
  };

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

  function hideNotice() {
    noticeEl.hidden = true;
    noticeEl.textContent = "";
  }

  function setAvailabilitySummary(message, tone) {
    availabilitySummary.textContent = message;
    availabilitySummary.dataset.tone = tone || "info";
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

  function dayOfWeek(dateString) {
    return new Date(`${dateString}T00:00:00`).getDay();
  }

  function isBookableDay(dateString) {
    const day = dayOfWeek(dateString);
    return day >= 1 && day <= 5;
  }

  function buildTimeSlots(dateString) {
    if (!dateString) return [];
    const configuredSlots = dayOfWeek(dateString) === 3 ? config.wednesdaySlots : config.weekdaySlots;
    if (Array.isArray(configuredSlots) && configuredSlots.length) return configuredSlots;
    const startHour = dayOfWeek(dateString) === 3 ? 10 : 15;
    return [0, 15, 30, 45].map((minute) => `${String(startHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }

  function slotLabel(dateString, time) {
    const dayText = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][dayOfWeek(dateString)] || "";
    return `${dayText} ${time}`;
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

    const tags = ["LIFF 綁定", "法律諮詢"];
    if (stage === "legal_book_submit") tags.push("預約送出");
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

  function normalizeAvailability(body, dateValue) {
    const allSlots = buildTimeSlots(dateValue);

    if (Array.isArray(body.slots)) {
      const availableSlots = body.slots.filter((slot) => slot.available !== false).map((slot) => slot.time);
      const bookedSlots = body.slots.filter((slot) => slot.available === false).map((slot) => slot.time);
      const closedSlots = body.slots.filter((slot) => slot.closed === true).map((slot) => slot.time);
      return { availableSlots, bookedSlots, closedSlots, notionUnavailable: Boolean(body.notionUnavailable), message: body.message || "" };
    }

    return {
      availableSlots: Array.isArray(body.availableSlots) ? body.availableSlots : allSlots,
      bookedSlots: Array.isArray(body.bookedSlots) ? body.bookedSlots : [],
      closedSlots: Array.isArray(body.closedSlots) ? body.closedSlots : [],
      notionUnavailable: Boolean(body.notionUnavailable),
      message: body.message || ""
    };
  }

  function renderTimeOptions(dateValue, availability) {
    const allSlots = buildTimeSlots(dateValue);
    const available = new Set(availability.availableSlots || []);
    const booked = new Set(availability.bookedSlots || []);
    const closed = new Set(availability.closedSlots || []);

    appointmentTime.innerHTML = "";
    appointmentTime.append(new Option("請選擇預約時間", ""));

    allSlots.forEach((time) => {
      const isAvailable = available.has(time) && !booked.has(time) && !closed.has(time);
      const label = closed.has(time) ? `${slotLabel(dateValue, time)}（未開放）` : booked.has(time) ? `${slotLabel(dateValue, time)}（已預約）` : slotLabel(dateValue, time);
      const option = new Option(label, isAvailable ? time : "");
      option.disabled = !isAvailable;
      appointmentTime.append(option);
    });

    const count = allSlots.filter((time) => available.has(time) && !booked.has(time) && !closed.has(time)).length;
    if (availability.notionUnavailable) {
      setAvailabilitySummary(availability.message || "暫時只能顯示基本時段，無法確認已預約時段。", "error");
      return;
    }
    if (count > 0) {
      setAvailabilitySummary(`此日期尚有 ${count} 個可預約時段。`, "success");
      return;
    }
    setAvailabilitySummary("此日期目前已無可預約時段，請選擇其他日期。", "error");
  }

  async function fetchAvailability(dateValue) {
    if (!hasConfiguredWebhook()) {
      return { availableSlots: buildTimeSlots(dateValue), bookedSlots: [] };
    }

    const body = await submitToN8n({
      action: "availability",
      actionLabel: "查詢可預約時段",
      source: "line-liff",
      submittedAt: new Date().toISOString(),
      data: { appointmentDate: dateValue }
    });

    return normalizeAvailability(body, dateValue);
  }

  async function refreshTimeOptions() {
    const dateValue = appointmentDate.value;
    appointmentTime.innerHTML = "";

    if (!dateValue) {
      appointmentTime.append(new Option("請先選擇日期", ""));
      setAvailabilitySummary("選擇日期後會顯示可預約時段。", "info");
      return;
    }

    if (!isBookableDay(dateValue)) {
      appointmentTime.append(new Option("週六、週日不開放預約", ""));
      appointmentTime.value = "";
      setAvailabilitySummary("預約日期僅開放週一至週五。", "error");
      showNotice("預約日期僅開放週一至週五，請重新選擇。", "error");
      return;
    }

    appointmentTime.append(new Option("讀取可預約時段中", ""));
    appointmentTime.disabled = true;
    setAvailabilitySummary("正在查詢目前可預約時段。", "info");

    try {
      const availability = await fetchAvailability(dateValue);
      state.availabilityByDate[dateValue] = availability;
      renderTimeOptions(dateValue, availability);
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
    const items = LEGAL_ITEM_MAP[legalCategory.value] || [];
    legalItem.innerHTML = "";
    legalItem.append(new Option(items.length ? "請選擇細項" : "請先選擇諮詢類別", ""));
    items.forEach((item) => legalItem.append(new Option(item, item)));
    legalOtherField.hidden = true;
  }

  function toggleLegalOther() {
    legalOtherField.hidden = !legalItem.value.includes("其它");
  }

  function formToObject(form) {
    const data = new FormData(form);
    const entries = [];
    data.forEach((value, key) => {
      if (value instanceof File) return;
      entries.push([key, String(value).trim()]);
    });
    return Object.fromEntries(entries);
  }

  function validatePayload(payload, mode) {
    if (mode === "book") {
      if (!isBookableDay(payload.appointmentDate)) return "預約日期僅開放週一至週五。";
      if (!payload.appointmentTime) return "請選擇可預約時段。";
      if (!payload.legalCategory || !payload.legalItem) return "請選擇諮詢類別與細項。";

      const availability = state.availabilityByDate[payload.appointmentDate];
      if (availability && !availability.availableSlots.includes(payload.appointmentTime)) {
        return "此時段目前已被預約，請改選其他可預約時段。";
      }
    }

    if ((mode === "query" || mode === "cancel") && !payload.appointmentId) {
      return "請填寫預約諮詢編號。";
    }
    return "";
  }

  function buildPayload(mode, form) {
    const profile = state.profile || {};
    const data = formToObject(form);
    if (mode === "book") {
      data.appointmentDateTime = `${data.appointmentDate}T${data.appointmentTime}:00+08:00`;
      data.appointmentSlotLabel = slotLabel(data.appointmentDate, data.appointmentTime);
      data.consultationType = "法律諮詢";
    }

    return {
      action: mode,
      actionLabel: actionLabels[mode],
      source: "line-liff",
      submittedAt: new Date().toISOString(),
      teamLineTarget: config.teamLineTarget || "",
      data: {
        ...data,
        lineUserId: profile.userId || "",
        lineDisplayName: profile.displayName || ""
      }
    };
  }

  function appendFiles(formData, form, inputName) {
    const input = form.elements[inputName];
    if (!input || !input.files) return;
    Array.from(input.files).forEach((file) => {
      formData.append(inputName, file, file.name);
    });
  }

  async function submitToN8n(payload, form) {
    const options = { method: "POST" };

    if (payload.action === "book" && form) {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      appendFiles(formData, form, "photoFiles");
      appendFiles(formData, form, "caseFiles");
      options.body = formData;
    } else {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(config.webhookBaseUrl, options);
    let body = {};
    try {
      body = await response.json();
    } catch (_) {
      body = {};
    }

    if (!response.ok || body.ok === false) {
      const error = new Error(body.message || "系統暫時無法處理，請稍後再試。");
      error.status = response.status || body.statusCode;
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
    showNotice("流程已完成，可關閉此頁面。", "success");
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
    submitButton.textContent = "送出中";
    hideNotice();

    try {
      const payload = buildPayload(mode, form);
      await captureMember(`legal_${mode}_submit`, payload.data);
      const result = await submitToN8n(payload, form);
      const titleMap = {
        book: "預約已送出",
        query: "查詢完成",
        cancel: "取消申請已送出"
      };
      const fallbackText = mode === "book" && result.appointmentId
        ? `預約諮詢編號：${result.appointmentId}`
        : "系統已收到資料。";
      finishFlow(titleMap[mode], result.message || fallbackText);
    } catch (error) {
      if (mode === "book" && (error.status === 409 || error.body?.statusCode === 409) && payloadData.appointmentDate) {
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
      setStatus("測試模式", "warn");
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
      setStatus("LINE 已連線", "success");
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
  legalCategory.addEventListener("change", updateLegalItems);
  legalItem.addEventListener("change", toggleLegalOther);
  closeButton.addEventListener("click", closeLiffWindow);

  updateLegalItems();
  setupBookingCalendar();
  setMode(state.mode);
  initLiff();
})();
