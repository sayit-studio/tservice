(function () {
  const config = window.APP_CONFIG || {};
  const state = {
    mode: new URLSearchParams(window.location.search).get("mode") || "book",
    liffReady: false,
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

  function formToObject(form) {
    const data = new FormData(form);
    return Object.fromEntries(Array.from(data.entries()).map(([key, value]) => [key, String(value).trim()]));
  }

  function validatePayload(payload, mode) {
    if (mode === "book" && !isWeekday(payload.appointmentDate)) {
      return "預約日期僅開放週一至週五。";
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
    return {
      action: mode,
      actionLabel: actionLabels[mode],
      source: "line-liff",
      submittedAt: new Date().toISOString(),
      teamLineTarget: config.teamLineTarget || "",
      data: formToObject(form)
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
      const result = await submitToN8n(buildPayload(mode, form));
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
  closeButton.addEventListener("click", closeLiffWindow);

  setupBookingCalendar();
  setMode(state.mode);
  initLiff();
})();
