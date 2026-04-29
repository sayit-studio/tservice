(function () {
  const CASE_STATUSES = ["新案件", "進行中", "追蹤中", "未完成案件", "已完成案件"];
  const CASE_CATEGORIES = [
    "陳情建議",
    "市府單位",
    "一般請託",
    "人事案",
    "託辦類別",
    "學籍安排",
    "府外單位",
    "民間救助",
    "醫療院所",
    "兵役",
    "總質詢",
    "車禍"
  ];
  const EVENT_STATUSES = ["籌備中", "進行中", "已完成"];
  const LEGAL_STATUSES = [
    { value: "confirmed", label: "已預約" },
    { value: "cancelled", label: "已取消" }
  ];
  const LEGAL_CATEGORIES = ["民事", "刑事", "行政訴訟", "家事", "勞資糾紛", "消費糾紛", "強制執行"];
  const STAFF_IDENTITIES = ["管理員", "志工", "助理", "主任", "議員", "一般人員"];
  const STAFF_PERMISSIONS = ["小編", "助理", "管理員", "一般人員"];

  const state = {
    user: null,
    cases: [],
    events: [],
    legal: [],
    staff: [],
    selected: {},
    calendarMode: "month",
    calendarDate: "",
    modal: null,
    pageSize: 10,
    pages: {
      cases: 1,
      events: 1,
      legal: 1,
      staff: 1
    }
  };

  const els = {
    loginView: document.getElementById("loginView"),
    appView: document.getElementById("appView"),
    loginForm: document.getElementById("loginForm"),
    loginMessage: document.getElementById("loginMessage"),
    logoutButton: document.getElementById("logoutButton"),
    roleLabel: document.getElementById("roleLabel"),
    viewTitle: document.getElementById("viewTitle"),
    syncStatus: document.getElementById("syncStatus"),
    refreshButton: document.getElementById("refreshButton"),
    navItems: Array.from(document.querySelectorAll(".nav-item")),
    panels: Array.from(document.querySelectorAll(".view-panel")),
    casesTable: document.getElementById("casesTable"),
    caseDetail: document.getElementById("caseDetail"),
    casePager: document.getElementById("casePager"),
    caseSearch: document.getElementById("caseSearch"),
    caseStatusFilter: document.getElementById("caseStatusFilter"),
    addCaseButton: document.getElementById("addCaseButton"),
    eventMonth: document.getElementById("eventMonth"),
    eventStatusFilter: document.getElementById("eventStatusFilter"),
    addEventButton: document.getElementById("addEventButton"),
    eventRegistrationButton: document.getElementById("eventRegistrationButton"),
    calendarGrid: document.getElementById("calendarGrid"),
    eventDetail: document.getElementById("eventDetail"),
    eventPager: document.getElementById("eventPager"),
    calendarModeButtons: Array.from(document.querySelectorAll("[data-calendar-mode]")),
    legalTable: document.getElementById("legalTable"),
    legalDetail: document.getElementById("legalDetail"),
    legalPager: document.getElementById("legalPager"),
    legalSearch: document.getElementById("legalSearch"),
    legalStatusFilter: document.getElementById("legalStatusFilter"),
    legalCategoryFilter: document.getElementById("legalCategoryFilter"),
    staffTable: document.getElementById("staffTable"),
    staffSearch: document.getElementById("staffSearch"),
    staffPager: document.getElementById("staffPager"),
    addStaffButton: document.getElementById("addStaffButton"),
    modalLayer: document.getElementById("modalLayer"),
    modalTitle: document.getElementById("modalTitle"),
    modalCloseButton: document.getElementById("modalCloseButton"),
    modalForm: document.getElementById("modalForm")
  };

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function isImageUrl(value) {
    const url = String(value || "").split("?")[0].toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
  }

  function renderAttachment(value) {
    const url = String(value || "").trim();
    if (!url) return "無";
    if (!isImageUrl(url)) return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    return `<button class="attachment-preview" type="button" data-preview-image="${escapeHtml(url)}"><img src="${escapeHtml(url)}" alt="案件附件" loading="lazy" /></button>`;
  }

  function asText(value) {
    if (Array.isArray(value)) return value.join("、");
    return String(value || "");
  }

  function asTextList(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    return String(value || "")
      .split(/[、,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function isNotionId(value) {
    const text = String(value || "").trim();
    return /^[0-9a-f]{32}$/i.test(text) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  }

  function casePetitionerName(value) {
    const text = String(value || "").trim();
    return text && !isNotionId(text) ? text : "未填寫";
  }

  function casePetitionerDetail(item) {
    const name = casePetitionerName(item.petitioner);
    return name === "未填寫" ? name : `${name} ${item.phone || ""}`.trim();
  }

  function dateForInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }

  function datetimeForInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function dateKeyFromDate(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function parseDateKey(value) {
    const parts = String(value || "").split("-").map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return new Date();
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function visibleCalendarDays(year, month) {
    if (!state.calendarDate) state.calendarDate = dateKeyFromDate(new Date(year, month - 1, 1));
    const selected = parseDateKey(state.calendarDate);
    if (state.calendarMode === "day") return [selected];
    if (state.calendarMode === "week") {
      const start = new Date(selected);
      start.setDate(selected.getDate() - selected.getDay());
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
      });
    }
    return Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => new Date(year, month - 1, index + 1));
  }

  function formatDateTime(value) {
    if (!value) return "未設定";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function formatTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function staffOptions(selected) {
    const options = ['<option value="">未指派</option>'];
    state.staff.forEach((staff) => {
      const value = staff.id || staff.name || staff.account;
      const label = staff.name || staff.account || staff.id;
      options.push(`<option value="${escapeHtml(value)}" ${String(selected || "") === String(value) || String(selected || "") === String(label) ? "selected" : ""}>${escapeHtml(label)}</option>`);
    });
    return options.join("");
  }

  function selectOptions(values, selected) {
    return values.map((item) => {
      const value = typeof item === "string" ? item : item.value;
      const label = typeof item === "string" ? item : item.label;
      return `<option value="${escapeHtml(value)}" ${String(selected || "") === String(value) ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function categoryTone(value) {
    const text = String(value || "");
    if (text.includes("?") || text.includes("??")) return "community";
    if (text.includes("?") || text.includes("??")) return "legal";
    if (text.includes("??") || text.includes("??")) return "service";
    if (text.includes("??") || text.includes("??")) return "meeting";
    if (text.includes("??") || text.includes("??")) return "festival";
    return "default";
  }

  function caseStatusRank(status) {
    const rank = CASE_STATUSES.indexOf(status);
    return rank === -1 ? CASE_STATUSES.length : rank;
  }

  function caseTimestamp(item) {
    const value = item.startDate || item.createdAt || item.created_at || item.createdTime || item.created_time || item.id || 0;
    const parsed = new Date(value).getTime();
    if (!Number.isNaN(parsed)) return parsed;
    const idTimestamp = String(item.id || "").match(/\d{10,}/);
    return idTimestamp ? Number(idTimestamp[0]) : 0;
  }

  function compareCases(a, b) {
    const rankDiff = caseStatusRank(a.status) - caseStatusRank(b.status);
    if (rankDiff !== 0) return rankDiff;
    return caseTimestamp(b) - caseTimestamp(a);
  }

  function badge(status, type) {
    const label = type === "legal" ? (LEGAL_STATUSES.find((item) => item.value === status)?.label || status || "未設定") : (status || "未設定");
    const done = status === "已完成" || status === "confirmed";
    const cancelled = status === "cancelled";
    return `<span class="status-badge ${done ? "done" : cancelled ? "cancelled" : "warn"}">${escapeHtml(label)}</span>`;
  }

  function cacheKey() {
    return `admin-cache:${state.user?.account || "anonymous"}`;
  }

  function readCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey()) || "{}");
      if (!cached.savedAt) return false;
      state.cases = Array.isArray(cached.cases) ? cached.cases : [];
      state.events = Array.isArray(cached.events) ? cached.events : [];
      state.legal = Array.isArray(cached.legal) ? cached.legal : [];
      state.staff = Array.isArray(cached.staff) ? cached.staff : [];
      els.syncStatus.textContent = `快取 ${new Date(cached.savedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}`;
      return true;
    } catch (_) {
      return false;
    }
  }

  function writeCache() {
    sessionStorage.setItem(cacheKey(), JSON.stringify({
      savedAt: new Date().toISOString(),
      cases: state.cases,
      events: state.events,
      legal: state.legal,
      staff: state.staff
    }));
  }

  function clearCache() {
    sessionStorage.removeItem(cacheKey());
  }

  function paginate(items, key) {
    const totalPages = Math.max(1, Math.ceil(items.length / state.pageSize));
    state.pages[key] = Math.min(Math.max(1, state.pages[key] || 1), totalPages);
    const start = (state.pages[key] - 1) * state.pageSize;
    return {
      totalPages,
      pageItems: items.slice(start, start + state.pageSize),
      start
    };
  }

  function renderPager(el, key, total, totalPages) {
    if (!el) return;
    el.innerHTML = `
      <span>第 ${state.pages[key]} / ${totalPages} 頁，共 ${total} 筆</span>
      <div class="pager-actions">
        <button class="secondary-button compact" type="button" data-page="${key}" data-dir="-1" ${state.pages[key] <= 1 ? "disabled" : ""}>上一頁</button>
        <button class="secondary-button compact" type="button" data-page="${key}" data-dir="1" ${state.pages[key] >= totalPages ? "disabled" : ""}>下一頁</button>
      </div>
    `;
  }

  function resetPage(key) {
    state.pages[key] = 1;
  }

  function renderActions(type, id) {
    const extra = type === "event"
      ? `<button class="secondary-button compact" type="button" data-registration="${escapeHtml(id)}">報名設定</button>`
      : "";
    return `
      <div class="detail-actions">
        <button class="secondary-button compact" type="button" data-edit="${type}" data-id="${escapeHtml(id)}">編輯</button>
        ${extra}
        <button class="danger-button compact" type="button" data-delete="${type}" data-id="${escapeHtml(id)}">刪除</button>
      </div>
    `;
  }

  function detail(title, rows, actions = "") {
    return `
      <div class="detail-title">
        <h3>${escapeHtml(title || "未命名")}</h3>
        ${actions}
      </div>
      <div class="detail-grid">
        ${rows.map((row) => `
          <div class="detail-row">
            <span>${escapeHtml(row.label)}</span>
            ${row.html ? row.value : row.multiline ? `<p>${escapeHtml(row.value || "未填寫")}</p>` : `<strong>${escapeHtml(row.value || "未填寫")}</strong>`}
          </div>
        `).join("")}
      </div>
    `;
  }

  async function loadAll(options = {}) {
    if (!options.force && readCache()) {
      renderAll();
      return;
    }
    els.syncStatus.textContent = "同步中";
    const [cases, events, legal, staff] = await Promise.all([
      AdminApi.listCases(),
      AdminApi.listEvents(),
      AdminApi.listLegalConsultations(),
      AdminApi.listStaff()
    ]);
    state.cases = Array.isArray(cases) ? cases : [];
    state.events = Array.isArray(events) ? events : [];
    state.legal = Array.isArray(legal) ? legal : [];
    state.staff = Array.isArray(staff) ? staff : [];
    els.syncStatus.textContent = "已同步";
    writeCache();
    renderAll();
  }

  function currentView() {
    return document.querySelector(".nav-item.is-active")?.dataset.view || "cases";
  }

  async function refreshCurrentView() {
    const view = currentView();
    els.syncStatus.textContent = "\u540c\u6b65\u4e2d";
    if (view === "cases") {
      const cases = await AdminApi.listCases();
      state.cases = Array.isArray(cases) ? cases : [];
      renderCases();
    }
    if (view === "events") {
      const events = await AdminApi.listEvents();
      state.events = Array.isArray(events) ? events : [];
      renderEvents();
    }
    if (view === "legal") {
      const legal = await AdminApi.listLegalConsultations();
      state.legal = Array.isArray(legal) ? legal : [];
      renderLegal();
    }
    if (view === "staff") {
      const staff = await AdminApi.listStaff();
      state.staff = Array.isArray(staff) ? staff : [];
      renderStaff();
    }
    els.syncStatus.textContent = "\u5df2\u540c\u6b65";
    writeCache();
  }

  function renderAll() {
    renderCases();
    renderEvents();
    renderLegal();
    renderStaff();
  }

  function renderCases() {
    const keyword = els.caseSearch.value.trim();
    const status = els.caseStatusFilter.value;
    const items = state.cases.filter((item) => {
      const petitioner = casePetitionerName(item.petitioner);
      const text = `${item.title} ${petitioner === "未填寫" ? "" : petitioner} ${item.caseNo} ${item.owner}`;
      return (!keyword || text.includes(keyword)) && (!status || item.status === status);
    }).sort(compareCases);
    const { pageItems, totalPages } = paginate(items, "cases");
    renderPager(els.casePager, "cases", items.length, totalPages);
    els.casesTable.innerHTML = pageItems.map((item) => `
      <tr data-id="${escapeHtml(item.id)}" class="${state.selected.caseId === item.id ? "is-selected" : ""}">
        <td><span class="title-cell"><strong>${escapeHtml(item.title || item.content || "未命名案件")}</strong><small>${escapeHtml(item.category || "")} ${escapeHtml(item.caseNo || "")}</small></span></td>
        <td>${escapeHtml(item.ownerName || item.owner || "未指派")}</td>
        <td>${badge(item.status)}</td>
        <td>${escapeHtml(casePetitionerName(item.petitioner))}</td>
        <td>${escapeHtml(item.startDate || "")}</td>
      </tr>
    `).join("");
    const selected = pageItems.find((item) => item.id === state.selected.caseId) || pageItems[0];
    if (selected) showCase(selected.id);
    if (!selected) els.caseDetail.innerHTML = detail("尚無案件", [{ label: "提示", value: "請新增或調整篩選條件。" }]);
  }

  function showCase(id) {
    state.selected.caseId = id;
    const item = state.cases.find((entry) => entry.id === id);
    if (!item) return;
    els.caseDetail.innerHTML = detail(item.title || "未命名案件", [
      { label: "負責人員", value: item.ownerName || item.owner || "未指派" },
      { label: "執行狀態", value: item.status },
      { label: "陳情人", value: casePetitionerDetail(item) },
      { label: "處理起始日期", value: item.startDate },
      { label: "1999案號", value: item.caseNo || "無" },
      { label: "執行狀況敘述", value: item.summary, multiline: true },
      { label: "陳情內容", value: item.content, multiline: true }
    ], renderActions("case", item.id));
    markSelected(els.casesTable, id);
  }

  function renderEvents() {
    if (!els.eventMonth.value) {
      const now = new Date();
      els.eventMonth.value = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    }
    const parts = els.eventMonth.value.split("-").map(Number);
    const year = parts[0];
    const month = parts[1];
    const monthKey = year + "-" + String(month).padStart(2, "0");
    if (!state.calendarDate || !state.calendarDate.startsWith(monthKey)) state.calendarDate = monthKey + "-01";
    const labels = ["\u65e5", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d"];
    const status = els.eventStatusFilter.value;
    const scopedEvents = state.events.filter((item) => {
      const date = String(item.date || item.startDate || "");
      if (state.calendarMode === "month") return date.startsWith(monthKey) && (!status || item.status === status);
      return (!status || item.status === status);
    });
    const days = visibleCalendarDays(year, month);
    els.calendarGrid.dataset.mode = state.calendarMode;
    let html = labels.map((label) => '<div class="calendar-head">' + label + '</div>').join("");
    if (state.calendarMode === "month") {
      const leading = new Date(year, month - 1, 1).getDay();
      for (let i = 0; i < leading; i += 1) html += '<div class="calendar-day is-empty is-padding"></div>';
    }
    days.forEach((date) => {
      const dateKey = dateKeyFromDate(date);
      const events = scopedEvents.filter((item) => String(item.date || item.startDate || "").startsWith(dateKey));
      const dayClass = events.length ? "has-events" : "is-empty";
      const selectedClass = state.calendarDate === dateKey ? " is-selected-day" : "";
      html += '<div class="calendar-day ' + dayClass + selectedClass + '" data-date="' + dateKey + '"><button class="day-number" type="button" data-date="' + dateKey + '">' + date.getDate() + '</button>' + events.map((event) => {
        const category = event.category || event.type || event.status || "";
        return '<button class="event-chip" type="button" data-event-id="' + escapeHtml(event.id) + '" data-status="' + escapeHtml(event.status || "") + '" data-category-tone="' + escapeHtml(categoryTone(category)) + '"><span class="event-chip-main"><strong>' + escapeHtml(event.title || "\u672a\u547d\u540d\u6d3b\u52d5") + '</strong><time>' + escapeHtml(formatTime(event.date)) + '</time></span><small>' + escapeHtml(event.community || event.venue || "") + '</small></button>';
      }).join("") + '</div>';
    });
    els.calendarGrid.innerHTML = html;
    const visibleEvents = scopedEvents.filter((item) => days.some((date) => String(item.date || item.startDate || "").startsWith(dateKeyFromDate(date))));
    els.eventPager.innerHTML = '<span>' + (state.calendarMode === "month" ? "\u672c\u6708" : state.calendarMode === "week" ? "\u672c\u9031" : "\u672c\u65e5") + '\u6d3b\u52d5 ' + visibleEvents.length + ' \u7b46</span>';
    const selected = visibleEvents.find((item) => item.id === state.selected.eventId) || visibleEvents[0];
    if (selected) showEvent(selected.id);
    if (!selected) els.eventDetail.innerHTML = detail("\u76ee\u524d\u6c92\u6709\u6d3b\u52d5", [{ label: "\u63d0\u793a", value: "\u8acb\u78ba\u8a8d\u6708\u4efd\u3001\u72c0\u614b\u7be9\u9078\uff0c\u6216\u65b0\u589e\u6d3b\u52d5\u3002" }]);
  }

  function showEvent(id) {
    state.selected.eventId = id;
    const item = state.events.find((entry) => entry.id === id);
    if (!item) return;
    els.eventDetail.innerHTML = detail(item.title || "未命名活動", [
      { label: "活動狀態", value: item.status },
      { label: "日期時間", value: formatDateTime(item.date) },
      { label: "社區名稱", value: item.community },
      { label: "活動場地", value: item.venue },
      { label: "負責人員", value: item.ownerName || item.owner || "未指派" },
      { label: "聯絡資訊", value: `${item.contact || ""} ${item.phone || ""}`.trim() },
      { label: "報名表單", value: item.registrationEnabled === "true" || item.registrationEnabled === true ? "開放報名" : "未開放" },
      { label: "報名網址", value: item.registrationUrl || "未設定" },
      { label: "報名截止", value: formatDateTime(item.registrationDeadline) },
      { label: "名額上限", value: item.registrationLimit },
      { label: "活動詳情", value: item.detail, multiline: true }
    ], renderActions("event", item.id));
  }

  function renderLegal() {
    const keyword = els.legalSearch.value.trim();
    const status = els.legalStatusFilter.value;
    const category = els.legalCategoryFilter.value;
    const items = state.legal.filter((item) => {
      const text = `${item.appointmentId} ${item.name} ${item.phone} ${item.case1999}`;
      return (!keyword || text.includes(keyword)) && (!status || item.status === status) && (!category || asText(item.category).includes(category));
    });
    const { pageItems, totalPages } = paginate(items, "legal");
    renderPager(els.legalPager, "legal", items.length, totalPages);
    els.legalTable.innerHTML = pageItems.map((item) => `
      <tr data-id="${escapeHtml(item.id)}" class="${state.selected.legalId === item.id ? "is-selected" : ""}">
        <td><span class="title-cell"><strong>${escapeHtml(item.appointmentId || "未編號")}</strong><small>${escapeHtml(item.case1999 || "無1999案號")}</small></span></td>
        <td>${escapeHtml(item.name || "")}</td>
        <td>${escapeHtml(asText(item.category))}</td>
        <td>${formatDateTime(item.appointmentDate)}</td>
        <td>${badge(item.status, "legal")}</td>
      </tr>
    `).join("");
    const selected = pageItems.find((item) => item.id === state.selected.legalId) || pageItems[0];
    if (selected) showLegal(selected.id);
    if (!selected) els.legalDetail.innerHTML = detail("尚無預約", [{ label: "提示", value: "目前沒有符合條件的法扶諮詢預約。" }]);
  }

  function showLegal(id) {
    state.selected.legalId = id;
    const item = state.legal.find((entry) => entry.id === id);
    if (!item) return;
    els.legalDetail.innerHTML = detail(item.appointmentId || "未編號", [
      { label: "姓名電話", value: `${item.name || ""} ${item.phone || ""}`.trim() },
      { label: "預約日期", value: formatDateTime(item.appointmentDate) },
      { label: "狀態", value: LEGAL_STATUSES.find((entry) => entry.value === item.status)?.label || item.status },
      { label: "法扶項目", value: asText(item.category) },
      { label: "細項分類", value: asText(item.subcategories) },
      { label: "其它項目名稱", value: item.otherName || "無" },
      { label: "1999案號", value: item.case1999 || "無" },
      { label: "附件連結", value: renderAttachment(item.attachmentUrl), html: true },
      { label: "事件陳述", value: item.statement, multiline: true }
    ], renderActions("legal", item.id));
    markSelected(els.legalTable, id);
  }

  function renderStaff() {
    const keyword = els.staffSearch.value.trim();
    const items = state.staff.filter((item) => {
      const text = `${item.name} ${item.account} ${item.identity} ${item.permissions}`;
      return !keyword || text.includes(keyword);
    });
    const { pageItems, totalPages } = paginate(items, "staff");
    renderPager(els.staffPager, "staff", items.length, totalPages);
    els.staffTable.innerHTML = pageItems.map((item) => `
      <tr data-id="${escapeHtml(item.id)}" class="${state.selected.staffId === item.id ? "is-selected" : ""}">
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.account)}</td>
        <td>${escapeHtml(item.identity || "")}</td>
        <td>${escapeHtml(asText(item.permissions))}</td>
      </tr>
    `).join("");
  }

  function markSelected(table, id) {
    table.querySelectorAll("tr[data-id]").forEach((row) => row.classList.toggle("is-selected", row.dataset.id === id));
  }

  function openModal(title, fields, onSubmit, onDelete) {
    els.modalTitle.textContent = title;
    els.modalForm.innerHTML = `
      <div class="modal-grid">
        ${fields.map(renderField).join("")}
      </div>
      <footer class="modal-actions">
        ${onDelete ? '<button class="danger-button" type="button" id="modalDeleteButton">刪除</button>' : ""}
        <span></span>
        <button class="secondary-button" type="button" id="modalCancelButton">取消</button>
        <button class="primary-button" type="submit">儲存</button>
      </footer>
    `;
    els.modalLayer.hidden = false;
    state.modal = { onSubmit, fields };
    document.getElementById("modalCancelButton").addEventListener("click", closeModal);
    const deleteButton = document.getElementById("modalDeleteButton");
    if (deleteButton) deleteButton.addEventListener("click", onDelete);
  }

  function renderField(field) {
    const value = field.value == null ? "" : field.value;
    if (field.type === "textarea") {
      return `<label class="field wide"><span>${escapeHtml(field.label)}</span><textarea name="${field.name}" rows="4">${escapeHtml(value)}</textarea></label>`;
    }
    if (field.type === "select") {
      return `<label class="field"><span>${escapeHtml(field.label)}</span><select name="${field.name}">${field.options}</select></label>`;
    }
    return `<label class="field ${field.wide ? "wide" : ""}"><span>${escapeHtml(field.label)}</span><input name="${field.name}" type="${field.type || "text"}" value="${escapeHtml(value)}" /></label>`;
  }

  function closeModal() {
    els.modalLayer.hidden = true;
    els.modalForm.innerHTML = "";
    state.modal = null;
  }

  function closeImagePreview() {
    const layer = document.querySelector(".image-preview-layer");
    if (layer) layer.remove();
  }

  function openImagePreview(url) {
    closeImagePreview();
    const layer = document.createElement("div");
    layer.className = "image-preview-layer";
    layer.innerHTML = `<button class="image-preview-close" type="button" aria-label="關閉">×</button><img src="${escapeHtml(url)}" alt="附件圖片" />`;
    document.body.append(layer);
  }

  function formObject(form) {
    return Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value]) => [key, String(value).trim()]));
  }

  async function submitModal(event) {
    event.preventDefault();
    if (!state.modal) return;
    await state.modal.onSubmit(formObject(event.currentTarget));
    clearCache();
    closeModal();
    await refreshCurrentView();
  }

  function openCaseForm(item = {}) {
    openModal(item.id ? "編輯案件" : "新增案件", [
      { name: "title", label: "案件主題", value: item.title, wide: true },
      { name: "petitioner", label: "陳情人", value: item.petitioner },
      { name: "phone", label: "陳情人電話", value: item.phone },
      { name: "caseNo", label: "1999案號", value: item.caseNo },
      { name: "startDate", label: "處理起始日期", type: "date", value: dateForInput(item.startDate) },
      { name: "status", label: "執行狀態", type: "select", options: '<option value="">未設定</option>' + selectOptions(CASE_STATUSES, item.status) },
      { name: "owner", label: "負責人員", type: "select", options: staffOptions(item.owner) },
      { name: "category", label: "建議事項類別", type: "select", options: selectOptions(CASE_CATEGORIES, item.category) },
      { name: "summary", label: "執行狀況敘述", type: "textarea", value: item.summary },
      { name: "content", label: "案件詳細說明", type: "textarea", value: item.content }
    ], (data) => AdminApi.saveCase({ ...item, ...data }), item.id ? () => deleteItem("case", item.id) : null);
  }

  async function saveEventWithRegistration(item, data) {
    const enabled = data.registrationEnabled === "true" || data.registrationEnabled === true;
    const payload = { ...item, ...data };
    if (!enabled) {
      payload.registrationUrl = "";
    }
    const saved = await AdminApi.saveEvent(payload);
    const savedItem = saved && typeof saved === "object" ? { ...payload, ...saved } : payload;
    const id = savedItem.id || item.id;
    if (enabled && id && !savedItem.registrationUrl) {
      await AdminApi.saveEvent({ ...savedItem, id, registrationEnabled: "true", registrationUrl: buildEventRegistrationUrl(id) });
    }
    return saved;
  }

  function openEventForm(item = {}) {
    openModal(item.id ? "編輯活動" : "新增活動", [
      { name: "title", label: "活動主題", value: item.title, wide: true },
      { name: "date", label: "活動日期時間", type: "datetime-local", value: datetimeForInput(item.date) },
      { name: "status", label: "活動狀態", type: "select", options: '<option value="">未設定</option>' + selectOptions(EVENT_STATUSES, item.status) },
      { name: "owner", label: "負責人員", type: "select", options: staffOptions(item.owner) },
      { name: "community", label: "社區名稱", value: item.community },
      { name: "venue", label: "活動場地", value: item.venue },
      { name: "expectedPeople", label: "人數預計", type: "number", value: item.expectedPeople },
      { name: "contact", label: "活動聯絡人", value: item.contact },
      { name: "phone", label: "聯絡人電話", value: item.phone },
      { name: "registrationEnabled", label: "報名表單", type: "select", options: selectOptions([{ value: "false", label: "不開放報名" }, { value: "true", label: "綁定預設活動報名表單" }], String(item.registrationEnabled === true ? "true" : item.registrationEnabled || "false")) },
      { name: "registrationDeadline", label: "報名截止時間", type: "datetime-local", value: datetimeForInput(item.registrationDeadline) },
      { name: "registrationLimit", label: "報名名額上限", type: "number", value: item.registrationLimit },
      { name: "registrationUrl", label: "報名表單網址", value: item.registrationUrl || buildEventRegistrationUrl(item.id), wide: true },
      { name: "registrationNote", label: "報名注意事項", type: "textarea", value: item.registrationNote },
      { name: "detail", label: "活動詳情", type: "textarea", value: item.detail }
    ], (data) => saveEventWithRegistration(item, data), item.id ? () => deleteItem("event", item.id) : null);
  }

  function openEventRegistrationForm(item = {}) {
    if (!item.id) {
      alert("請先選擇一個活動，或先新增活動後再設定報名表單。");
      return;
    }
    const registrationUrl = item.registrationUrl || buildEventRegistrationUrl(item.id);
    openModal("新增/設定報名表單", [
      { name: "title", label: "活動主題", value: item.title, wide: true },
      { name: "registrationEnabled", label: "報名表單", type: "select", options: selectOptions([{ value: "true", label: "開放報名" }, { value: "false", label: "不開放" }], String(item.registrationEnabled === false || item.registrationEnabled === "false" ? "false" : "true")) },
      { name: "registrationDeadline", label: "報名截止時間", type: "datetime-local", value: datetimeForInput(item.registrationDeadline) },
      { name: "registrationLimit", label: "報名名額上限", type: "number", value: item.registrationLimit },
      { name: "registrationUrl", label: "報名表單網址", value: registrationUrl, wide: true },
      { name: "registrationNote", label: "報名注意事項", type: "textarea", value: item.registrationNote }
    ], (data) => saveEventWithRegistration(item, { ...data, registrationEnabled: data.registrationEnabled || "true" }), null);
  }

  function buildEventRegistrationUrl(eventId) {
    if (!eventId) return "";
    const base = "https://tseng-service.pages.dev/liff/event-registration/";
    return `${base}?eventId=${encodeURIComponent(eventId)}`;
  }

  function openLegalForm(item = {}) {
    openModal("編輯法扶諮詢", [
      { name: "appointmentId", label: "預約編號", value: item.appointmentId },
      { name: "name", label: "姓名", value: item.name },
      { name: "phone", label: "電話", value: item.phone },
      { name: "appointmentDate", label: "預約日期時間", type: "datetime-local", value: datetimeForInput(item.appointmentDate) },
      { name: "status", label: "狀態", type: "select", options: selectOptions(LEGAL_STATUSES, item.status) },
      { name: "category", label: "法扶項目", type: "select", options: selectOptions(LEGAL_CATEGORIES, asText(item.category)) },
      { name: "case1999", label: "1999案號", value: item.case1999 },
      { name: "attachmentUrl", label: "附件連結", value: item.attachmentUrl, wide: true },
      { name: "otherName", label: "其它項目名稱", value: item.otherName, wide: true },
      { name: "statement", label: "事件陳述", type: "textarea", value: item.statement }
    ], (data) => AdminApi.saveLegalConsultation({ ...item, ...data }), item.id ? () => deleteItem("legal", item.id) : null);
  }

  function openStaffForm(item = {}) {
    if (!isAdminUser()) return;
    openModal(item.id ? "編輯人員" : "新增人員", [
      { name: "name", label: "人員名稱", value: item.name },
      { name: "account", label: "帳號", value: item.account },
      { name: "password", label: "密碼", value: item.password },
      { name: "identity", label: "身分", type: "select", options: selectOptions(STAFF_IDENTITIES, asText(item.identity)) },
      { name: "permissions", label: "權限設定", type: "select", options: selectOptions(STAFF_PERMISSIONS, asText(item.permissions)) }
    ], (data) => AdminApi.saveStaff({ ...item, ...data }), item.id ? () => deleteItem("staff", item.id) : null);
  }

  async function deleteItem(type, id) {
    if (!confirm("確定要刪除這筆資料嗎？")) return;
    if (type === "case") await AdminApi.deleteCase(id);
    if (type === "event") await AdminApi.deleteEvent(id);
    if (type === "legal") await AdminApi.deleteLegalConsultation(id);
    if (type === "staff") await AdminApi.deleteStaff(id);
    clearCache();
    closeModal();
    await refreshCurrentView();
  }

  function handleDetailClick(event) {
    const edit = event.target.closest("[data-edit]");
    const del = event.target.closest("[data-delete]");
    const registration = event.target.closest("[data-registration]");
    if (registration) {
      openEventRegistrationForm(state.events.find((item) => item.id === registration.dataset.registration));
      return;
    }
    if (edit) {
      const type = edit.dataset.edit;
      const id = edit.dataset.id;
      if (type === "case") openCaseForm(state.cases.find((item) => item.id === id));
      if (type === "event") openEventForm(state.events.find((item) => item.id === id));
      if (type === "legal") openLegalForm(state.legal.find((item) => item.id === id));
    }
    if (del) deleteItem(del.dataset.delete, del.dataset.id);
    const preview = event.target.closest("[data-preview-image]");
    if (preview) openImagePreview(preview.dataset.previewImage);
  }

  function switchView(view) {
    if (view === "staff" && !isAdminUser()) return;
    els.navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
    els.panels.forEach((panel) => {
      const active = panel.id === `${view}View`;
      panel.classList.toggle("is-active", active);
      if (active) els.viewTitle.textContent = panel.dataset.title;
    });
  }

  function isAdminUser() {
    const user = state.user || {};
    const accessValues = [
      ...asTextList(user.role),
      ...asTextList(user.identity),
      ...asTextList(user.permissions),
      ...asTextList(user.permission)
    ];
    if (!accessValues.length) return true;
    return accessValues.some((value) => ["all", "admin", "管理者", "管理員", "主任", "議員"].includes(value));
  }

  function applyRole() {
    const user = state.user || {};
    const displayName = user.name || user.account || user.email || "未命名使用者";
    const displayRole = asText(user.role || user.identity || user.permissions || "").trim();
    els.roleLabel.textContent = displayRole ? `${displayName}｜${displayRole}` : displayName;
    document.querySelectorAll(".admin-only").forEach((node) => {
      node.hidden = !isAdminUser();
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      state.user = await AdminApi.login(String(data.get("account")).trim(), String(data.get("password")).trim());
      sessionStorage.setItem("staffConsoleUser", JSON.stringify(state.user));
      els.loginView.hidden = true;
      els.appView.hidden = false;
      applyRole();
      await loadAll();
    } catch (error) {
      els.loginMessage.textContent = error.message;
    }
  }

  function logout() {
    sessionStorage.removeItem("staffConsoleUser");
    state.user = null;
    els.appView.hidden = true;
    els.loginView.hidden = false;
  }

  function bindEvents() {
    els.loginForm.addEventListener("submit", handleLogin);
    els.logoutButton.addEventListener("click", logout);
    els.refreshButton.addEventListener("click", () => {
      clearCache();
      loadAll({ force: true });
    });
    els.modalCloseButton.addEventListener("click", closeModal);
    document.addEventListener("click", (event) => {
      if (event.target.closest(".image-preview-close") || event.target.classList.contains("image-preview-layer")) closeImagePreview();
    });
    els.modalForm.addEventListener("submit", submitModal);
    [els.caseDetail, els.eventDetail, els.legalDetail].forEach((node) => node.addEventListener("click", handleDetailClick));
    els.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
    els.calendarModeButtons.forEach((button) => button.addEventListener("click", () => { state.calendarMode = button.dataset.calendarMode || "month"; els.calendarModeButtons.forEach((item) => item.classList.toggle("is-active", item === button)); renderEvents(); }));
    [els.caseSearch, els.caseStatusFilter].forEach((el) => el.addEventListener("input", () => { resetPage("cases"); renderCases(); }));
    [els.eventMonth, els.eventStatusFilter].forEach((el) => el.addEventListener("input", () => { resetPage("events"); renderEvents(); }));
    [els.legalSearch, els.legalStatusFilter, els.legalCategoryFilter].forEach((el) => el.addEventListener("input", () => { resetPage("legal"); renderLegal(); }));
    els.staffSearch.addEventListener("input", () => { resetPage("staff"); renderStaff(); });
    els.addCaseButton.addEventListener("click", () => openCaseForm());
    els.addEventButton.addEventListener("click", () => openEventForm());
    els.eventRegistrationButton.addEventListener("click", () => openEventRegistrationForm(state.events.find((item) => item.id === state.selected.eventId)));
    els.addStaffButton.addEventListener("click", () => openStaffForm());
    els.casesTable.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (row) showCase(row.dataset.id);
    });
    els.legalTable.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (row) showLegal(row.dataset.id);
    });
    els.staffTable.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (row && isAdminUser()) openStaffForm(state.staff.find((item) => item.id === row.dataset.id));
    });
    els.calendarGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-event-id]");
      if (button) showEvent(button.dataset.eventId);
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (!button) return;
      const key = button.dataset.page;
      state.pages[key] += Number(button.dataset.dir);
      if (key === "cases") renderCases();
      if (key === "events") renderEvents();
      if (key === "legal") renderLegal();
      if (key === "staff") renderStaff();
    });
  }

  function initLegalCategories() {
    LEGAL_CATEGORIES.forEach((name) => {
      els.legalCategoryFilter.append(new Option(name, name));
    });
  }

  async function init() {
    bindEvents();
    initLegalCategories();
    const saved = sessionStorage.getItem("staffConsoleUser");
    if (saved) {
      state.user = JSON.parse(saved);
      els.loginView.hidden = true;
      els.appView.hidden = false;
      applyRole();
      await loadAll();
    }
  }

  init();
})();
