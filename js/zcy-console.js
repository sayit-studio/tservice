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
  const LINE_ACCOUNT_DEFAULTS = [
    {
      key: "internal-team",
      name: "內部團隊 LINE OA",
      purpose: "同仁手機端新增/編輯資料、查看行事曆、追蹤案件進度。",
      enabled: "true",
      channelId: "",
      basicId: "",
      webhookUrl: "",
      liffUrls: "https://tseng-service.pages.dev/liff/internal-team/",
      workflowName: "internal-team-line-oa",
      accessTokenEnv: "LINE_INTERNAL_CHANNEL_ACCESS_TOKEN",
      channelSecretEnv: "LINE_INTERNAL_CHANNEL_SECRET",
      hasAccessToken: false,
      hasChannelSecret: false,
      liffIds: "",
      note: "",
      lastCheckedAt: ""
    },
    {
      key: "public-service",
      name: "對外民眾 LINE OA",
      purpose: "民眾加好友、留言、點擊 LIFF 或選單互動後取得 LINE User ID 並建立會員資料。",
      enabled: "true",
      channelId: "",
      basicId: "",
      webhookUrl: "https://drwu.zeabur.app/webhook/line-oa-members",
      liffUrls: "https://liff.line.me/2009640939-ACYipKCx\nhttps://liff.line.me/2009640939-vwvDFasL",
      workflowName: "public-line-oa-members",
      accessTokenEnv: "LINE_PUBLIC_CHANNEL_ACCESS_TOKEN",
      channelSecretEnv: "LINE_PUBLIC_CHANNEL_SECRET",
      hasAccessToken: false,
      hasChannelSecret: false,
      liffIds: "2009640939-ACYipKCx\n2009640939-vwvDFasL",
      note: "",
      lastCheckedAt: ""
    }
  ];
  const state = {
    user: null,
    cases: [],
    events: [],
    eventRegistrations: [],
    legal: [],
    members: [],
    lineAccounts: [],
    staff: [],
    selected: {},
    calendarMode: "month",
    calendarDate: "",
    eventDetailOpen: false,
    modal: null,
    pageSize: 10,
    registrationPageSize: 25,
    pages: {
      cases: 1,
      events: 1,
      registrations: 1,
      legal: 1,
      members: 1,
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
    calendarPrev: document.getElementById("calendarPrev"),
    calendarNext: document.getElementById("calendarNext"),
    calendarNavLabel: document.getElementById("calendarNavLabel"),
    eventStatusFilter: document.getElementById("eventStatusFilter"),
    addEventButton: document.getElementById("addEventButton"),
    eventRegistrationButton: document.getElementById("eventRegistrationButton"),
    calendarGrid: document.getElementById("calendarGrid"),
    eventDetail: document.getElementById("eventDetail"),
    eventPager: document.getElementById("eventPager"),
    calendarModeButtons: Array.from(document.querySelectorAll("[data-calendar-mode]")),
    taskDate: document.getElementById("taskDate"),
    taskTypeFilter: document.getElementById("taskTypeFilter"),
    taskStatusFilter: document.getElementById("taskStatusFilter"),
    taskStaffFilter: document.getElementById("taskStaffFilter"),
    taskTodayButton: document.getElementById("taskTodayButton"),
    taskSummary: document.getElementById("taskSummary"),
    taskList: document.getElementById("taskList"),
    taskDetail: document.getElementById("taskDetail"),
    registrationEventSelect: document.getElementById("registrationEventSelect"),
    refreshRegistrationsButton: document.getElementById("refreshRegistrationsButton"),
    registrationsTable: document.getElementById("registrationsTable"),
    registrationsPager: document.getElementById("registrationsPager"),
    legalTable: document.getElementById("legalTable"),
    legalDetail: document.getElementById("legalDetail"),
    legalPager: document.getElementById("legalPager"),
    legalSearch: document.getElementById("legalSearch"),
    legalStatusFilter: document.getElementById("legalStatusFilter"),
    legalCategoryFilter: document.getElementById("legalCategoryFilter"),
    membersTable: document.getElementById("membersTable"),
    memberDetail: document.getElementById("memberDetail"),
    memberPager: document.getElementById("memberPager"),
    memberSearch: document.getElementById("memberSearch"),
    memberTagFilter: document.getElementById("memberTagFilter"),
    memberAttributeFilter: document.getElementById("memberAttributeFilter"),
    memberStatusFilter: document.getElementById("memberStatusFilter"),
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


  function lineList(value) {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || "").split(/\n/).map((item) => item.trim()).filter(Boolean);
  }

  function mergeLineAccountDefaults(items) {
    const incoming = Array.isArray(items) ? items : [];
    return LINE_ACCOUNT_DEFAULTS.map((defaults) => {
      const saved = incoming.find((item) => item.key === defaults.key) || {};
      return { ...defaults, ...saved, key: defaults.key, accessTokenEnv: defaults.accessTokenEnv, channelSecretEnv: defaults.channelSecretEnv };
    });
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
    const phone = item.phone || "";
    return name === "未填寫" ? name : `${name} ${phone}`.trim();
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

  function dateKeyFromValue(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value).slice(0, 10);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return dateKeyFromDate(date);
  }

  function parseDateKey(value) {
    const parts = String(value || "").split("-").map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return new Date();
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function visibleCalendarDays(year, month) {
    if (!state.calendarDate) state.calendarDate = dateKeyFromDate(new Date(year, month - 1, 1));
    const selected = parseDateKey(state.calendarDate);
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return "未指定時間";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function scheduleDateTime(value) {
    if (!value) return "未設定";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return `${value} 未指定時間`;
    return formatDateTime(value);
  }

  function formatMonthDay(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function eventDateValue(item) {
    return item.date || item.startDate || "";
  }

  function eventHour(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return 9;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 9;
    return Math.min(21, Math.max(8, date.getHours()));
  }

  function scheduleTimeValue(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return Number.MAX_SAFE_INTEGER;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
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
      state.eventRegistrations = [];
      state.legal = Array.isArray(cached.legal) ? cached.legal : [];
      state.members = Array.isArray(cached.members) ? cached.members : [];
      state.lineAccounts = mergeLineAccountDefaults(cached.lineAccounts);
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
      members: state.members,
      lineAccounts: state.lineAccounts,
      staff: state.staff
    }));
  }

  function clearCache() {
    sessionStorage.removeItem(cacheKey());
  }

  function paginate(items, key) {
    const pageSize = key === "registrations" ? state.registrationPageSize : state.pageSize;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    state.pages[key] = Math.min(Math.max(1, state.pages[key] || 1), totalPages);
    const start = (state.pages[key] - 1) * pageSize;
    return {
      totalPages,
      pageItems: items.slice(start, start + pageSize),
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
    const close = type === "event"
      ? `<button class="icon-button" type="button" data-close-detail aria-label="關閉">×</button>`
      : "";
    return `
      <div class="detail-actions">
        <button class="secondary-button compact" type="button" data-edit="${type}" data-id="${escapeHtml(id)}">編輯</button>
        ${extra}
        <button class="danger-button compact" type="button" data-delete="${type}" data-id="${escapeHtml(id)}">刪除</button>
        ${close}
      </div>
    `;
  }

  function detail(title, rows, actions = "", options = {}) {
    return `
      <div class="detail-title">
        <h3>${escapeHtml(title || "未命名")}</h3>
        ${actions}
      </div>
      <div class="detail-grid ${options.compact ? "is-compact" : ""}">
        ${rows.map((row) => `
          <div class="detail-row ${row.wide ? "is-wide" : ""}">
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
    const [cases, events, legal, members, lineAccounts, staff] = await Promise.all([
      AdminApi.listCases(),
      AdminApi.listEvents(),
      AdminApi.listLegalConsultations(),
      AdminApi.listMembers().catch(() => []),
      AdminApi.listLineAccounts().catch(() => []),
      AdminApi.listStaff()
    ]);
    state.cases = Array.isArray(cases) ? cases : [];
    state.events = Array.isArray(events) ? events : [];
    state.eventRegistrations = [];
    state.legal = Array.isArray(legal) ? legal : [];
    state.members = Array.isArray(members) ? members : [];
    state.lineAccounts = mergeLineAccountDefaults(lineAccounts);
    state.staff = Array.isArray(staff) ? staff : [];
    els.syncStatus.textContent = "已同步";
    writeCache();
    enrichUserFromStaff();
    renderAll();
  }

  function enrichUserFromStaff() {
    if (!state.user || !state.staff.length) return;
    const match = state.staff.find((s) => s.id === state.user.id || (s.account && s.account === state.user.account));
    if (!match) return;
    const enriched = { ...match, ...state.user, name: state.user.name || match.name, account: state.user.account || match.account, identity: state.user.identity || match.identity };
    if (enriched.name === state.user.name && enriched.account === state.user.account) return;
    state.user = enriched;
    sessionStorage.setItem("staffConsoleUser", JSON.stringify(state.user));
    applyRole();
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
      renderRegistrationEventOptions();
    }
    if (view === "registrations") {
      await loadEventRegistrations(els.registrationEventSelect.value);
    }
    if (view === "legal") {
      const legal = await AdminApi.listLegalConsultations();
      state.legal = Array.isArray(legal) ? legal : [];
      renderLegal();
    }
    if (view === "members") {
      const members = await AdminApi.listMembers();
      state.members = Array.isArray(members) ? members : [];
      renderMemberFilters();
      renderMembers();
    }
    if (view === "tasks") {
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
      renderTaskStaffOptions();
      renderTaskView();
    }
    if (view === "lineAccounts") {
      const lineAccounts = await AdminApi.listLineAccounts();
      state.lineAccounts = mergeLineAccountDefaults(lineAccounts);
      renderLineAccounts();
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
    renderTaskStaffOptions();
    renderTaskView();
    renderRegistrationEventOptions();
    renderRegistrations();
    renderLegal();
    renderMemberFilters();
    renderMembers();
    renderLineAccounts();
    renderStaff();
  }

  function renderCases() {
    const keyword = els.caseSearch.value.trim();
    const status = els.caseStatusFilter.value;
    const items = state.cases.filter((item) => {
      const text = `${item.caseNo} ${item.petitioner || ""} ${item.staff || ""} ${item.category || ""} ${item.content || ""}`;
      return (!keyword || text.includes(keyword)) && (!status || item.status === status);
    }).sort(compareCases);
    const { pageItems, totalPages } = paginate(items, "cases");
    renderPager(els.casePager, "cases", items.length, totalPages);
    els.casesTable.innerHTML = pageItems.map((item) => `
      <tr data-id="${escapeHtml(item.id)}" class="${state.selected.caseId === item.id ? "is-selected" : ""}">
        <td><span class="title-cell"><strong>${escapeHtml(item.caseNo || "未編號")}</strong><small>${escapeHtml(item.category || "")} ${escapeHtml(item.requestDate || "")}</small></span></td>
        <td>${escapeHtml(item.staff || "未指派")}</td>
        <td>${badge(item.status)}</td>
        <td>${escapeHtml(casePetitionerName(item.petitioner))}</td>
        <td>${escapeHtml(item.requestDate || "")}</td>
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
    els.caseDetail.innerHTML = detail(item.caseNo || "未編號案件", [
      { label: "處理狀況", value: item.status },
      { label: "請託日期", value: item.requestDate || "無" },
      { label: "託辦類別", value: item.category || "無" },
      { label: "接案秘書", value: item.staff || "未指派" },
      { label: "當事人名", value: item.petitioner || "未填寫" },
      { label: "行動電話", value: item.phone || "無" },
      { label: "通訊地址", value: item.address || "無" },
      { label: "委託人名", value: item.commissioner || "無" },
      { label: "關係", value: item.relation || "無" },
      { label: "處理天數", value: item.processingDays || "無" },
      { label: "託辦事項", value: item.content, multiline: true },
      { label: "交辦會勘記錄", value: item.inspectionNote, multiline: true },
      { label: "公開摘要", value: item.summary, multiline: true }
    ], renderActions("case", item.id));
    markSelected(els.casesTable, id);
  }

  function renderEvents() {
    if (!state.calendarDate) state.calendarDate = dateKeyFromDate(new Date());
    const ref = parseDateKey(state.calendarDate);
    const year = ref.getFullYear();
    const month = ref.getMonth() + 1;
    const monthKey = year + "-" + String(month).padStart(2, "0");
    updateCalendarNavLabel(ref);
    const labels = ["\u65e5", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d"];
    const status = els.eventStatusFilter.value;
    const scopedEvents = state.events.filter((item) => {
      const date = String(eventDateValue(item));
      if (state.calendarMode === "month") return date.startsWith(monthKey) && (!status || item.status === status);
      return (!status || item.status === status);
    });
    const days = visibleCalendarDays(year, month);
    els.calendarGrid.dataset.mode = state.calendarMode;
    if (state.calendarMode === "week") {
      els.calendarGrid.innerHTML = renderWeekCalendar(days, scopedEvents);
    } else {
      let html = labels.map((label) => '<div class="calendar-head">' + label + '</div>').join("");
      const leading = new Date(year, month - 1, 1).getDay();
      for (let i = 0; i < leading; i += 1) html += '<div class="calendar-day is-empty is-padding"></div>';
      days.forEach((date) => {
        const dateKey = dateKeyFromDate(date);
        const events = scopedEvents.filter((item) => String(eventDateValue(item)).startsWith(dateKey))
          .sort((a, b) => scheduleTimeValue(eventDateValue(a)) - scheduleTimeValue(eventDateValue(b)));
        const visibleEvents = events.slice(0, 3);
        const hiddenCount = Math.max(0, events.length - visibleEvents.length);
        const dayClass = events.length ? "has-events" : "is-empty";
        const selectedClass = state.calendarDate === dateKey ? " is-selected-day" : "";
        html += '<div class="calendar-day ' + dayClass + selectedClass + '" data-date="' + dateKey + '"><button class="day-number" type="button" data-date="' + dateKey + '">' + date.getDate() + '</button>' + visibleEvents.map(renderEventChip).join("") + (hiddenCount ? '<button class="more-events-button" type="button" data-more-date="' + dateKey + '">+' + hiddenCount + ' 更多</button>' : "") + '</div>';
      });
      els.calendarGrid.innerHTML = html;
    }
    const visibleEvents = scopedEvents.filter((item) => days.some((date) => String(eventDateValue(item)).startsWith(dateKeyFromDate(date))));
    els.eventPager.innerHTML = '<span>' + (state.calendarMode === "month" ? "\u672c\u6708" : "\u672c\u9031") + '\u6d3b\u52d5 ' + visibleEvents.length + ' \u7b46' + (state.calendarMode === "month" ? "，日期格最多顯示 3 筆" : "") + '</span>';
    if (!visibleEvents.some((item) => item.id === state.selected.eventId)) closeEventDetail();
  }

  function renderEventChip(event) {
    const category = event.category || event.type || event.status || "";
    const selectedClass = state.selected.eventId === event.id && state.eventDetailOpen ? " is-selected" : "";
    return '<button class="event-chip' + selectedClass + '" type="button" data-event-id="' + escapeHtml(event.id) + '" data-status="' + escapeHtml(event.status || "") + '" data-category-tone="' + escapeHtml(categoryTone(category)) + '"><span class="event-chip-main"><strong>' + escapeHtml(event.title || "\u672a\u547d\u540d\u6d3b\u52d5") + '</strong><time>' + escapeHtml(formatTime(eventDateValue(event))) + '</time></span><small>' + escapeHtml(event.community || event.venue || "") + '</small></button>';
  }

  function closeDayEventsModal() {
    document.querySelector(".day-events-layer")?.remove();
  }

  function openDayEventsModal(dateKey) {
    closeDayEventsModal();
    const status = els.eventStatusFilter.value;
    const events = state.events
      .filter((item) => dateKeyFromValue(eventDateValue(item)) === dateKey && (!status || item.status === status))
      .sort((a, b) => scheduleTimeValue(eventDateValue(a)) - scheduleTimeValue(eventDateValue(b)));
    const layer = document.createElement("div");
    layer.className = "day-events-layer";
    layer.innerHTML = `
      <section class="day-events-modal" role="dialog" aria-modal="true" aria-labelledby="dayEventsTitle">
        <header class="day-events-head">
          <div>
            <h3 id="dayEventsTitle">${escapeHtml(dateKey)} 活動</h3>
            <p>${events.length} 筆活動，依時間排序</p>
          </div>
          <button class="icon-button day-events-close" type="button" aria-label="關閉">×</button>
        </header>
        <div class="day-events-list">
          ${events.length ? events.map((event) => `
            <article class="day-event-card">
              <div class="day-event-card-head">
                <time>${escapeHtml(formatTime(eventDateValue(event)) || "未指定時間")}</time>
                ${badge(event.status)}
              </div>
              <h4>${escapeHtml(event.title || "未命名活動")}</h4>
              <dl>
                <div><dt>社區/地點</dt><dd>${escapeHtml([event.community, event.venue].filter(Boolean).join("｜") || "無")}</dd></div>
                <div><dt>負責人</dt><dd>${escapeHtml(event.ownerName || event.owner || "未指派")}</dd></div>
                <div><dt>聯絡資訊</dt><dd>${escapeHtml(`${event.contact || ""} ${event.phone || ""}`.trim() || "無")}</dd></div>
              </dl>
              ${event.detail ? `<p>${escapeHtml(event.detail)}</p>` : ""}
              <button class="secondary-button compact" type="button" data-day-event-id="${escapeHtml(event.id)}">查看活動</button>
            </article>
          `).join("") : '<div class="empty-state">當日沒有符合條件的活動。</div>'}
        </div>
      </section>
    `;
    layer.addEventListener("click", (event) => {
      if (event.target === layer || event.target.closest(".day-events-close")) {
        closeDayEventsModal();
        return;
      }
      const button = event.target.closest("[data-day-event-id]");
      if (button) {
        closeDayEventsModal();
        showEvent(button.dataset.dayEventId);
      }
    });
    document.body.append(layer);
  }

  function renderWeekCalendar(days, scopedEvents) {
    const weekLabels = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    const todayKey = dateKeyFromDate(new Date());
    const hours = Array.from({ length: 14 }, (_, index) => index + 8);
    let html = '<div class="week-calendar"><div class="week-time-corner"></div>';
    days.forEach((date) => {
      const dateKey = dateKeyFromDate(date);
      html += '<div class="week-day-head' + (dateKey === todayKey ? " is-today" : "") + '"><small>' + weekLabels[date.getDay()] + '</small><strong>' + date.getDate() + '</strong><small>' + formatMonthDay(date) + '</small></div>';
    });
    hours.forEach((hour) => {
      html += '<div class="week-time-label">' + (hour < 12 ? "上午" : "下午") + (hour > 12 ? hour - 12 : hour) + '</div>';
      days.forEach((date) => {
        const dateKey = dateKeyFromDate(date);
        const events = scopedEvents.filter((item) => String(eventDateValue(item)).startsWith(dateKey) && eventHour(eventDateValue(item)) === hour)
          .sort((a, b) => new Date(eventDateValue(a)).getTime() - new Date(eventDateValue(b)).getTime());
        html += '<div class="week-slot' + (events.length ? " has-events" : "") + '" data-date="' + dateKey + '" data-hour="' + hour + '">' + events.map((event) => {
          const selectedClass = state.selected.eventId === event.id && state.eventDetailOpen ? " is-selected" : "";
          return '<button class="week-event' + selectedClass + '" type="button" data-event-id="' + escapeHtml(event.id) + '" data-status="' + escapeHtml(event.status || "") + '"><time>' + escapeHtml(formatTime(eventDateValue(event))) + '</time><strong>' + escapeHtml(event.title || "未命名活動") + '</strong><small>' + escapeHtml(event.community || event.venue || "") + '</small></button>';
        }).join("") + '</div>';
      });
    });
    return html + '</div>';
  }

  function renderCopyUrlButton(url) {
    if (!url) return "<strong>未設定</strong>";
    return `<button class="secondary-button compact copy-url-button" type="button" data-copy-url="${escapeHtml(url)}">點我複製</button>`;
  }

  function updateCalendarNavLabel(ref) {
    if (!els.calendarNavLabel) return;
    const y = ref.getFullYear();
    const m = ref.getMonth() + 1;
    if (state.calendarMode === "month") {
      els.calendarNavLabel.textContent = y + "\u5e74" + m + "\u6708";
    } else {
      const sun = new Date(ref);
      sun.setDate(ref.getDate() - ref.getDay());
      const sat = new Date(sun);
      sat.setDate(sun.getDate() + 6);
      const sm = sun.getMonth() + 1;
      const em = sat.getMonth() + 1;
      els.calendarNavLabel.textContent = sm === em
        ? sm + "\u6708" + sun.getDate() + "\u2013" + sat.getDate() + "\u65e5"
        : sm + "\u6708" + sun.getDate() + "\u65e5 \u2013 " + em + "\u6708" + sat.getDate() + "\u65e5";
    }
  }

  function navigateCalendar(dir) {
    const date = parseDateKey(state.calendarDate);
    if (state.calendarMode === "month") {
      date.setDate(1);
      date.setMonth(date.getMonth() + dir);
    } else {
      date.setDate(date.getDate() + dir * 7);
    }
    state.calendarDate = dateKeyFromDate(date);
    renderEvents();
  }

  function openMonthPicker() {
    closeMonthPicker();
    const ref = parseDateKey(state.calendarDate);
    let pickerYear = ref.getFullYear();
    const picker = document.createElement("div");
    picker.id = "calMonthPicker";
    picker.className = "cal-month-picker";
    document.body.appendChild(picker);
    const rect = els.calendarNavLabel.getBoundingClientRect();
    picker.style.top = (rect.bottom + window.scrollY + 6) + "px";
    picker.style.left = (rect.left + window.scrollX) + "px";

    function paint() {
      const MONTHS = ["1\u6708","2\u6708","3\u6708","4\u6708","5\u6708","6\u6708","7\u6708","8\u6708","9\u6708","10\u6708","11\u6708","12\u6708"];
      const today = new Date();
      picker.innerHTML = `
        <div class="cal-picker-year">
          <button type="button" data-py="-1">&#8249;</button>
          <strong>${pickerYear}\u5e74</strong>
          <button type="button" data-py="1">&#8250;</button>
        </div>
        <div class="cal-picker-months">
          ${MONTHS.map((label, i) => {
            const isCurrent = ref.getFullYear() === pickerYear && ref.getMonth() === i;
            const isToday = today.getFullYear() === pickerYear && today.getMonth() === i;
            return `<button class="cal-picker-month${isCurrent ? " is-selected" : ""}${isToday ? " is-today" : ""}" type="button" data-pm="${pickerYear}-${String(i + 1).padStart(2, "0")}">${label}</button>`;
          }).join("")}
        </div>`;
    }

    paint();
    picker.addEventListener("click", (e) => {
      const py = e.target.closest("[data-py]");
      if (py) { pickerYear += Number(py.dataset.py); paint(); return; }
      const pm = e.target.closest("[data-pm]");
      if (pm) {
        const [y, mo] = pm.dataset.pm.split("-").map(Number);
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === mo;
        state.calendarDate = isCurrentMonth ? dateKeyFromDate(today) : y + "-" + String(mo).padStart(2, "0") + "-01";
        closeMonthPicker();
        renderEvents();
      }
    });
    window.setTimeout(() => document.addEventListener("click", onPickerOutside), 0);
  }

  function onPickerOutside(e) {
    const picker = document.getElementById("calMonthPicker");
    if (!picker) return;
    if (!picker.contains(e.target) && e.target !== els.calendarNavLabel) {
      closeMonthPicker();
    } else {
      document.addEventListener("click", onPickerOutside, { once: true });
    }
  }

  function closeMonthPicker() {
    const el = document.getElementById("calMonthPicker");
    if (el) el.remove();
    document.removeEventListener("click", onPickerOutside);
  }

  function showEvent(id) {
    state.selected.eventId = id;
    state.eventDetailOpen = true;
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
      { label: "報名網址", value: renderCopyUrlButton(eventRegistrationUrl(item)), html: true },
      { label: "報名截止", value: formatDateTime(item.registrationDeadline) },
      { label: "名額上限", value: item.registrationLimit },
      { label: "活動詳情", value: item.detail, multiline: true, wide: true }
    ], renderActions("event", item.id), { compact: true });
    els.eventDetail.classList.add("is-open");
    openDrawerBackdrop();
    renderEvents();
  }

  function openDrawerBackdrop() {
    if (document.querySelector(".drawer-backdrop")) return;
    const backdrop = document.createElement("div");
    backdrop.className = "drawer-backdrop";
    backdrop.dataset.closeDetail = "true";
    document.body.append(backdrop);
  }

  function closeEventDetail() {
    state.eventDetailOpen = false;
    els.eventDetail.classList.remove("is-open");
    document.querySelector(".drawer-backdrop")?.remove();
  }

  function eventOptionLabel(item) {
    const meta = [item.community, formatDateTime(item.date)].filter(Boolean).join("｜");
    return `${item.title || "未命名活動"}${meta ? `（${meta}）` : ""}`;
  }

  function renderRegistrationEventOptions() {
    if (!els.registrationEventSelect) return;
    const selected = state.selected.registrationEventId || els.registrationEventSelect.value;
    els.registrationEventSelect.innerHTML = [
      '<option value="">請先選擇活動</option>',
      ...state.events.map((item) => `<option value="${escapeHtml(item.id)}" ${String(selected) === String(item.id) ? "selected" : ""}>${escapeHtml(eventOptionLabel(item))}</option>`)
    ].join("");
  }

  async function loadEventRegistrations(eventId) {
    state.selected.registrationEventId = eventId || "";
    state.eventRegistrations = [];
    resetPage("registrations");
    renderRegistrations();
    if (!eventId) return;

    els.registrationsTable.innerHTML = `<tr><td colspan="7" class="registration-empty">載入報名名單中...</td></tr>`;
    try {
      const registrations = await AdminApi.listEventRegistrations(eventId);
      state.eventRegistrations = Array.isArray(registrations) ? registrations : [];
    } catch (error) {
      state.eventRegistrations = [];
      els.registrationsTable.innerHTML = `<tr><td colspan="7" class="registration-empty">${escapeHtml(error.message || "名單載入失敗")}</td></tr>`;
      return;
    }
    renderRegistrations();
  }

  function renderRegistrations() {
    if (!els.registrationsTable) return;
    const eventId = state.selected.registrationEventId || "";
    if (!eventId) {
      els.registrationsTable.innerHTML = `<tr><td colspan="8" class="registration-empty">請先從上方下拉選擇活動，系統才會顯示報名名單。</td></tr>`;
      renderPager(els.registrationsPager, "registrations", 0, 1);
      return;
    }

    const items = state.eventRegistrations.filter((item) => !item.eventId || item.eventId === eventId);
    const { pageItems, totalPages } = paginate(items, "registrations");
    renderPager(els.registrationsPager, "registrations", items.length, totalPages);
    if (!pageItems.length) {
      els.registrationsTable.innerHTML = `<tr><td colspan="8" class="registration-empty">這個活動目前沒有報名資料。</td></tr>`;
      return;
    }

    els.registrationsTable.innerHTML = pageItems.map((item) => {
      const isCancelled = item.status === "cancelled";
      const actionBtn = isCancelled
        ? `<button class="secondary-button compact" type="button" data-restore-reg="${escapeHtml(item.id)}">恢復報名</button>`
        : `<button class="danger-button compact" type="button" data-cancel-reg="${escapeHtml(item.id)}">取消報名</button>`;
      const dupBadge = item.isDuplicate ? `<span class="dup-badge" title="${escapeHtml(item.note || "重複報名")}">重複報名</span>` : "";
      return `
        <tr${isCancelled ? ' class="row-cancelled"' : ""}>
          <td><span class="title-cell"><strong>${escapeHtml(item.registrationId || item.id || "")}</strong><small>${escapeHtml(item.note || "")}</small></span></td>
          <td>${escapeHtml(item.name || "")}</td>
          <td>${escapeHtml(item.phone || "")}</td>
          <td>${escapeHtml(item.companions || 0)}</td>
          <td><span class="title-cell"><strong>${escapeHtml(item.lineDisplayName || "")}</strong><small>${escapeHtml(item.lineUserId || "")}</small></span></td>
          <td><span class="status-group">${badge(item.status || "registered")}${dupBadge}</span></td>
          <td>${formatDateTime(item.createdAt || item.createdTime)}</td>
          <td>${actionBtn}</td>
        </tr>`;
    }).join("");
  }

  async function updateRegistrationStatus(id, status) {
    const label = status === "cancelled" ? "取消" : "恢復";
    if (!confirm(`確定要${label}這筆報名嗎？`)) return;
    try {
      await AdminApi.updateEventRegistration({ id, status });
      const item = state.eventRegistrations.find((r) => r.id === id);
      if (item) item.status = status;
      renderRegistrations();
    } catch (error) {
      alert(error.message || `${label}報名失敗`);
    }
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

  function memberTagList(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    return String(value || "").split(/[、,，\n\s]+/).map((item) => item.trim()).filter(Boolean);
  }

  function memberTagText(value) {
    return memberTagList(value).join("、");
  }

  function memberLastInteraction(item) {
    return item.lastInteractionAt || item.lastEditedAt || item.submittedAt || item.createdAt || "";
  }

  function renderMemberFilters() {
    if (!els.memberAttributeFilter || !els.memberStatusFilter) return;
    const selectedAttribute = els.memberAttributeFilter.value;
    const selectedStatus = els.memberStatusFilter.value;
    const attributes = Array.from(new Set(state.members.map((item) => item.attribute).filter(Boolean))).sort();
    const statuses = Array.from(new Set(state.members.map((item) => item.status).filter(Boolean))).sort();
    els.memberAttributeFilter.innerHTML = [
      '<option value="">全部屬性</option>',
      ...attributes.map((value) => `<option value="${escapeHtml(value)}" ${value === selectedAttribute ? "selected" : ""}>${escapeHtml(value)}</option>`)
    ].join("");
    els.memberStatusFilter.innerHTML = [
      '<option value="">全部狀態</option>',
      ...statuses.map((value) => `<option value="${escapeHtml(value)}" ${value === selectedStatus ? "selected" : ""}>${escapeHtml(value)}</option>`)
    ].join("");
  }

  function renderMembers() {
    if (!els.membersTable) return;
    const keyword = els.memberSearch.value.trim();
    const tag = els.memberTagFilter.value.trim();
    const attribute = els.memberAttributeFilter.value;
    const status = els.memberStatusFilter.value;
    const items = state.members.filter((item) => {
      const tags = memberTagText(item.interactionTags);
      const text = `${item.name} ${item.phone} ${item.lineId} ${item.lineName} ${tags} ${item.attribute} ${item.status}`;
      return (!item.lineId ? false : true)
        && (!keyword || text.includes(keyword))
        && (!tag || tags.includes(tag))
        && (!attribute || item.attribute === attribute)
        && (!status || item.status === status);
    }).sort((a, b) => new Date(memberLastInteraction(b)).getTime() - new Date(memberLastInteraction(a)).getTime());
    const { pageItems, totalPages } = paginate(items, "members");
    renderPager(els.memberPager, "members", items.length, totalPages);
    els.membersTable.innerHTML = pageItems.map((item) => `
      <tr data-id="${escapeHtml(item.id)}" class="${state.selected.memberId === item.id ? "is-selected" : ""}">
        <td><span class="title-cell"><strong>${escapeHtml(item.name || item.lineName || "未命名會員")}</strong><small>${escapeHtml(item.attribute || item.status || "")}</small></span></td>
        <td>${escapeHtml(item.phone || "")}</td>
        <td><span class="title-cell"><strong>${escapeHtml(item.lineName || "")}</strong><small>${escapeHtml(item.lineId || "")}</small></span></td>
        <td>${escapeHtml(memberTagText(item.interactionTags))}</td>
        <td>${formatDateTime(memberLastInteraction(item))}</td>
      </tr>
    `).join("");
    const selected = pageItems.find((item) => item.id === state.selected.memberId) || pageItems[0];
    if (selected) showMember(selected.id);
    if (!selected) els.memberDetail.innerHTML = detail("尚無會員", [{ label: "提示", value: "目前沒有符合條件且具 LINE ID 的會員。" }]);
  }

  function showMember(id) {
    state.selected.memberId = id;
    const item = state.members.find((entry) => entry.id === id);
    if (!item) return;
    els.memberDetail.innerHTML = detail(item.name || item.lineName || "未命名會員", [
      { label: "LINE ID", value: item.lineId },
      { label: "LINE 名稱", value: item.lineName },
      { label: "行動電話", value: item.phone },
      { label: "狀態", value: item.status },
      { label: "人員屬性", value: item.attribute },
      { label: "互動記錄標籤", value: memberTagText(item.interactionTags) || "無" },
      { label: "活動紀錄", value: item.activityRecord || item.activityRecord2 || "無", multiline: true },
      { label: "最後互動", value: formatDateTime(memberLastInteraction(item)) },
      { label: "備註", value: item.note, multiline: true, wide: true }
    ], `<div class="detail-actions"><button class="secondary-button compact" type="button" data-edit="member" data-id="${escapeHtml(item.id)}">編輯標籤</button></div>`);
    markSelected(els.membersTable, id);
  }

  function taskTypeLabel(type) {
    return { event: "活動", case: "陳情案件", legal: "法扶諮詢" }[type] || type;
  }

  function taskStatusLabel(task) {
    if (task.type === "legal") return LEGAL_STATUSES.find((item) => item.value === task.status)?.label || task.status || "未設定";
    return task.status || "未設定";
  }

  function taskOwnerKeys(task) {
    const source = task.source || {};
    return [task.owner, source.owner, source.ownerName, source.ownerAccount, source.ownerId]
      .map((value) => String(value || "").trim())
      .filter(Boolean);
  }

  function staffFilterKeys(value) {
    if (!value) return [];
    const staff = state.staff.find((item) => String(item.id) === value || String(item.name) === value || String(item.account) === value);
    if (!staff) return [String(value)];
    return [staff.id, staff.name, staff.account].map((item) => String(item || "").trim()).filter(Boolean);
  }

  function taskMatchesStaff(task, staffValue) {
    if (!staffValue) return true;
    const ownerKeys = taskOwnerKeys(task);
    if (staffValue === "__unassigned") return !ownerKeys.length;
    if (task.type === "legal" && !ownerKeys.length) return false;
    const filterKeys = staffFilterKeys(staffValue);
    return ownerKeys.some((owner) => filterKeys.some((key) => owner === key));
  }

  function renderTaskStaffOptions() {
    if (!els.taskStaffFilter) return;
    const selected = els.taskStaffFilter.value;
    els.taskStaffFilter.innerHTML = [
      '<option value="">全部人員</option>',
      '<option value="__unassigned">未指派</option>',
      ...state.staff.map((staff) => {
        const value = staff.id || staff.name || staff.account;
        const label = staff.name || staff.account || staff.id;
        return `<option value="${escapeHtml(value)}" ${String(selected) === String(value) ? "selected" : ""}>${escapeHtml(label)}</option>`;
      })
    ].join("");
  }

  function buildTaskItems() {
    return [
      ...state.events.map((item) => ({
        id: item.id,
        type: "event",
        date: eventDateValue(item),
        dateKey: dateKeyFromValue(eventDateValue(item)),
        title: item.title || "未命名活動",
        subtitle: [item.community, item.venue].filter(Boolean).join("｜"),
        owner: item.ownerName || item.owner,
        status: item.status,
        source: item
      })),
      ...state.cases.map((item) => ({
        id: item.id,
        type: "case",
        date: item.requestDate,
        dateKey: dateKeyFromValue(item.requestDate),
        title: item.caseNo || item.content || "未命名案件",
        subtitle: [item.category, casePetitionerName(item.petitioner)].filter((value) => value && value !== "未填寫").join("｜"),
        owner: item.staff || "",
        status: item.status,
        source: item
      })),
      ...state.legal.map((item) => ({
        id: item.id,
        type: "legal",
        date: item.appointmentDate,
        dateKey: dateKeyFromValue(item.appointmentDate),
        title: item.appointmentId || "未編號",
        subtitle: [item.name, asText(item.category)].filter(Boolean).join("｜"),
        owner: "",
        status: item.status,
        source: item
      }))
    ].filter((item) => item.dateKey);
  }

  function renderTaskStatusOptions(tasks) {
    if (!els.taskStatusFilter) return;
    const selected = els.taskStatusFilter.value;
    const statuses = Array.from(new Set(tasks.map(taskStatusLabel).filter(Boolean))).sort();
    els.taskStatusFilter.innerHTML = [
      '<option value="">全部狀態</option>',
      ...statuses.map((status) => `<option value="${escapeHtml(status)}" ${status === selected ? "selected" : ""}>${escapeHtml(status)}</option>`)
    ].join("");
  }

  function renderTaskView() {
    if (!els.taskDate) return;
    if (!els.taskDate.value) els.taskDate.value = dateKeyFromDate(new Date());
    const dateKey = els.taskDate.value;
    const type = els.taskTypeFilter.value;
    const staff = els.taskStaffFilter.value;
    const allTasks = buildTaskItems().filter((task) => task.dateKey === dateKey && (!type || task.type === type) && taskMatchesStaff(task, staff));
    renderTaskStatusOptions(allTasks);
    const status = els.taskStatusFilter.value;
    const tasks = allTasks
      .filter((task) => !status || taskStatusLabel(task) === status)
      .sort((a, b) => scheduleTimeValue(a.date) - scheduleTimeValue(b.date) || taskTypeLabel(a.type).localeCompare(taskTypeLabel(b.type), "zh-Hant"));
    const counts = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {});
    els.taskSummary.innerHTML = `
      <strong>${escapeHtml(dateKey)}</strong>
      <span>活動 ${counts.event || 0}</span>
      <span>陳情案件 ${counts.case || 0}</span>
      <span>法扶諮詢 ${counts.legal || 0}</span>
      ${staff ? `<span>人員 ${escapeHtml(staff === "__unassigned" ? "未指派" : (state.staff.find((item) => String(item.id) === staff || String(item.name) === staff || String(item.account) === staff)?.name || staff))}</span>` : ""}
    `;
    els.taskList.innerHTML = tasks.length ? tasks.map((task) => `
      <button class="task-card ${state.selected.taskId === `${task.type}:${task.id}` ? "is-selected" : ""}" type="button" data-task-type="${escapeHtml(task.type)}" data-task-id="${escapeHtml(task.id)}">
        <span class="task-time">${escapeHtml(formatTime(task.date) || "未指定時間")}</span>
        <span class="task-content">
          <strong>${escapeHtml(task.title)}</strong>
          <small>${escapeHtml(task.subtitle || task.owner || "無補充資訊")}</small>
        </span>
        <span class="task-type">${escapeHtml(taskTypeLabel(task.type))}</span>
      </button>
    `).join("") : `<div class="empty-state">當日沒有符合條件的任務。</div>`;
    const selected = tasks.find((task) => `${task.type}:${task.id}` === state.selected.taskId) || tasks[0];
    if (selected) showTask(selected.type, selected.id, false);
    else els.taskDetail.innerHTML = detail("尚無任務", [{ label: "提示", value: "請切換日期、類型或狀態查看行程。" }]);
  }

  function showTask(type, id, rerender = true) {
    const task = buildTaskItems().find((item) => item.type === type && item.id === id);
    if (!task) return;
    state.selected.taskId = `${type}:${id}`;
    if (rerender) {
      els.taskList.querySelectorAll(".task-card").forEach((node) => {
        node.classList.toggle("is-selected", node.dataset.taskType === type && node.dataset.taskId === id);
      });
    }
    const source = task.source;
    const rows = [
      { label: "類型", value: taskTypeLabel(type) },
      { label: "時間", value: scheduleDateTime(task.date) },
      { label: "狀態", value: taskStatusLabel(task) },
      { label: "負責人", value: task.owner || "未指派" }
    ];
    if (type === "event") {
      rows.push(
        { label: "社區/地點", value: [source.community, source.venue].filter(Boolean).join("｜") || "無" },
        { label: "聯絡資訊", value: `${source.contact || ""} ${source.phone || ""}`.trim() || "無" },
        { label: "活動內容", value: source.detail, multiline: true, wide: true }
      );
    }
    if (type === "case") {
      rows.push(
        { label: "請託案號", value: source.caseNo || "無" },
        { label: "當事人名", value: casePetitionerName(source.petitioner) },
        { label: "託辦類別", value: source.category || "無" },
        { label: "公開摘要", value: source.summary || source.content, multiline: true, wide: true }
      );
    }
    if (type === "legal") {
      rows.push(
        { label: "民眾資訊", value: `${source.name || ""} ${source.phone || ""}`.trim() || "無" },
        { label: "諮詢類型", value: asText(source.category) || "無" },
        { label: "1999案號", value: source.case1999 || "無" },
        { label: "陳述內容", value: source.statement, multiline: true, wide: true }
      );
    }
    const actions = `<div class="detail-actions">
      <button class="secondary-button compact" type="button" data-open-task="${escapeHtml(type)}" data-id="${escapeHtml(id)}">前往管理頁</button>
      <button class="secondary-button compact" type="button" data-edit="${escapeHtml(type)}" data-id="${escapeHtml(id)}">編輯</button>
    </div>`;
    els.taskDetail.innerHTML = detail(task.title, rows, actions, { compact: true });
  }


  function renderLineAccounts() {
    if (!els.lineAccountsGrid) return;
    const accounts = mergeLineAccountDefaults(state.lineAccounts);
    els.lineAccountsGrid.innerHTML = accounts.map((item) => {
      const enabled = String(item.enabled) !== "false";
      const liffUrls = lineList(item.liffUrls);
      const liffIds = lineList(item.liffIds || item.liffId);
      const tokenStatus = item.hasAccessToken ? "已設定" : "未設定";
      const secretStatus = item.hasChannelSecret ? "已設定" : "未設定";
      const hint = item.key === "public-service"
        ? "處理 follow、message、postback 與 LIFF userId，寫入會員管理。"
        : "提供同仁外出時手機端新增/編輯案件、查看行事曆與輸入追蹤進度。";
      return `
        <article class="line-account-card">
          <header class="line-account-title">
            <div>
              <span class="status-badge ${enabled ? "done" : "cancelled"}">${enabled ? "啟用" : "停用"}</span>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(hint)}</p>
            </div>
            <button class="secondary-button compact" type="button" data-edit="lineAccount" data-id="${escapeHtml(item.key)}">編輯</button>
          </header>
          <div class="detail-grid">
            <div class="detail-row"><span>Channel ID</span><strong>${escapeHtml(item.channelId || "未填寫")}</strong></div>
            <div class="detail-row"><span>Basic ID</span><strong>${escapeHtml(item.basicId || "未填寫")}</strong></div>
            <div class="detail-row"><span>Webhook URL</span><strong>${escapeHtml(item.webhookUrl || "未設定")}</strong></div>
            <div class="detail-row"><span>LIFF ID</span><p>${liffIds.length ? liffIds.map(escapeHtml).join("<br>") : "未設定"}</p></div>
            <div class="detail-row"><span>LIFF URL</span><p>${liffUrls.length ? liffUrls.map(escapeHtml).join("<br>") : "未設定"}</p></div>
            <div class="detail-row"><span>n8n workflow</span><strong>${escapeHtml(item.workflowName || "未設定")}</strong></div>
            <div class="detail-row token-row"><span>Channel access token</span><strong>${escapeHtml(tokenStatus)}</strong><small>儲存後不回顯明碼</small></div>
            <div class="detail-row token-row"><span>Channel secret</span><strong>${escapeHtml(secretStatus)}</strong><small>Webhook 簽章驗證使用</small></div>
            <div class="detail-row"><span>最後檢查</span><strong>${escapeHtml(formatDateTime(item.lastCheckedAt))}</strong></div>
            <div class="detail-row"><span>備註</span><p>${escapeHtml(item.note || "無")}</p></div>
          </div>
        </article>
      `;
    }).join("");
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

  async function uploadToImgbb(file) {
    const apiKey = (window.ADMIN_CONFIG || {}).imgbbApiKey || "";
    if (!apiKey) throw new Error("請在 config.js 設定 imgbbApiKey");
    if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} 超過 5MB 限制`);
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const form = new FormData();
    form.append("image", base64);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, { method: "POST", body: form });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "imgbb 上傳失敗");
    return json.data.url;
  }

  function appendUploadUrl(fieldName, url) {
    const hiddenInput = els.modalForm.querySelector(`input[name="${CSS.escape(fieldName)}"]`);
    const thumbsEl = document.getElementById(`thumbs-${fieldName}`);
    if (!hiddenInput || !thumbsEl) return;
    const existing = hiddenInput.value ? hiddenInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (!existing.includes(url)) existing.push(url);
    hiddenInput.value = existing.join(",");
    const thumb = document.createElement("div");
    thumb.className = "upload-thumb";
    thumb.dataset.url = url;
    thumb.innerHTML = `<img src="${escapeHtml(url)}" alt="" /><button type="button" class="upload-thumb-remove" data-remove-url="${escapeHtml(url)}">✕</button>`;
    thumbsEl.append(thumb);
  }

  function removeUploadUrl(fieldName, url) {
    const hiddenInput = els.modalForm.querySelector(`input[name="${CSS.escape(fieldName)}"]`);
    if (!hiddenInput) return;
    const existing = hiddenInput.value.split(",").map((s) => s.trim()).filter((u) => u && u !== url);
    hiddenInput.value = existing.join(",");
    const thumb = document.getElementById(`thumbs-${fieldName}`)?.querySelector(`[data-url="${CSS.escape(url)}"]`);
    thumb?.remove();
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
    els.modalForm.querySelectorAll("[data-copy-target]").forEach((button) => {
      button.addEventListener("click", copyFieldValue);
    });
    els.modalForm.querySelectorAll("input[data-upload-target]").forEach((fileInput) => {
      fileInput.addEventListener("change", async () => {
        const fieldName = fileInput.dataset.uploadTarget;
        const progressEl = document.getElementById(`progress-${fieldName}`);
        const files = Array.from(fileInput.files);
        for (const file of files) {
          if (progressEl) progressEl.textContent = `上傳中：${file.name}…`;
          try {
            const url = await uploadToImgbb(file);
            appendUploadUrl(fieldName, url);
            if (progressEl) progressEl.textContent = "";
          } catch (err) {
            if (progressEl) progressEl.textContent = `⚠️ ${err.message}`;
          }
        }
        fileInput.value = "";
      });
    });
    els.modalForm.addEventListener("click", (event) => {
      const removeBtn = event.target.closest("[data-remove-url]");
      if (!removeBtn) return;
      const url = removeBtn.dataset.removeUrl;
      const fieldEl = removeBtn.closest("[data-field-name]");
      if (fieldEl) removeUploadUrl(fieldEl.dataset.fieldName, url);
    });
  }

  function renderField(field) {
    const value = field.value == null ? "" : field.value;
    const placeholder = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : "";
    const autocomplete = field.autocomplete ? ` autocomplete="${escapeHtml(field.autocomplete)}"` : "";
    if (field.type === "copy-url") {
      return `
        <label class="field wide copy-field">
          <span>${escapeHtml(field.label)}</span>
          <div class="copy-field-row">
            <input name="${field.name}" type="hidden" value="${escapeHtml(value)}" readonly />
            <strong class="copy-field-summary">已產生簽到連結</strong>
            <button class="secondary-button compact" type="button" data-copy-target="${escapeHtml(field.name)}">點我複製</button>
          </div>
        </label>
      `;
    }
    if (field.type === "textarea") {
      return `<label class="field wide"><span>${escapeHtml(field.label)}</span><textarea name="${field.name}" rows="4"${placeholder}>${escapeHtml(value)}</textarea></label>`;
    }
    if (field.type === "select") {
      return `<label class="field"><span>${escapeHtml(field.label)}</span><select name="${field.name}">${field.options}</select></label>`;
    }
    if (field.type === "image-upload") {
      const urls = String(value).split(",").map((s) => s.trim()).filter(Boolean);
      const previews = urls.map((url) => `<div class="upload-thumb" data-url="${escapeHtml(url)}"><img src="${escapeHtml(url)}" alt="" /><button type="button" class="upload-thumb-remove" data-remove-url="${escapeHtml(url)}">✕</button></div>`).join("");
      return `
        <div class="field wide upload-field" data-field-name="${escapeHtml(field.name)}">
          <span class="field-label">${escapeHtml(field.label)}</span>
          <input type="hidden" name="${escapeHtml(field.name)}" value="${escapeHtml(value)}" />
          <div class="upload-thumbs" id="thumbs-${escapeHtml(field.name)}">${previews}</div>
          <label class="upload-add-btn">
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden data-upload-target="${escapeHtml(field.name)}" />
            <span class="secondary-button compact">+ 選擇圖片</span>
          </label>
          <span class="upload-hint">支援 jpg/png/gif/webp，單張上限 5MB</span>
          <span class="upload-progress" id="progress-${escapeHtml(field.name)}"></span>
        </div>`;
    }
    return `<label class="field ${field.wide ? "wide" : ""}"><span>${escapeHtml(field.label)}</span><input name="${field.name}" type="${field.type || "text"}" value="${escapeHtml(value)}"${placeholder}${autocomplete} ${field.readonly ? "readonly" : ""} /></label>`;
  }

  async function copyFieldValue(event) {
    const name = event.currentTarget.dataset.copyTarget;
    const input = els.modalForm.querySelector(`[name="${CSS.escape(name)}"]`);
    if (!input || !input.value) return;
    await copyText(input.value, event.currentTarget);
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

  function generateCaseNo() {
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const prefix = `${rocYear}${mm}${dd}`;
    const todayCount = (state.cases || []).filter((c) => String(c.caseNo || "").startsWith(prefix)).length;
    return `${prefix}${String(todayCount + 1).padStart(3, "0")}`;
  }

  function openCaseForm(item = {}) {
    const isNew = !item.id;
    const autoCaseNo = isNew ? generateCaseNo() : item.caseNo;
    const today = new Date().toISOString().slice(0, 10);
    openModal(item.id ? "編輯案件" : "新增案件", [
      { name: "caseNo", label: "請託案號", value: autoCaseNo, wide: true, readonly: isNew },
      { name: "requestDate", label: "請託日期", type: "date", value: item.requestDate ? dateForInput(item.requestDate) : today },
      { name: "category", label: "託辦類別", type: "select", options: '<option value="">未設定</option>' + selectOptions(CASE_CATEGORIES, item.category) },
      { name: "staff", label: "接案秘書", value: item.staff },
      { name: "petitioner", label: "當事人名", value: item.petitioner },
      { name: "phone", label: "行動電話", value: item.phone },
      { name: "address", label: "通訊地址", value: item.address, wide: true },
      { name: "commissioner", label: "委託人名", value: item.commissioner },
      { name: "relation", label: "與當事人關係", value: item.relation },
      { name: "content", label: "託辦事項", type: "textarea", value: item.content, wide: true },
      { name: "status", label: "處理狀況", type: "select", options: '<option value="">未設定</option>' + selectOptions(CASE_STATUSES, item.status) },
      { name: "processingDays", label: "處理天數", type: "number", value: item.processingDays },
      { name: "inspectionNote", label: "交辦會勘記錄", type: "textarea", value: item.inspectionNote },
      { name: "summary", label: "公開摘要", type: "textarea", value: item.summary },
      { name: "beforeImages", label: "改善前圖片", type: "image-upload", value: item.beforeImages || "" },
      { name: "afterImages", label: "改善後圖片", type: "image-upload", value: item.afterImages || "" }
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
      await AdminApi.saveEvent({ ...savedItem, id, registrationEnabled: "true", registrationUrl: buildEventRegistrationUrl(id, savedItem.title, savedItem.date) });
    }
    return saved;
  }

  async function copyText(value, button) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      if (button) {
        const original = button.textContent;
        button.textContent = "已複製";
        window.setTimeout(() => {
          button.textContent = original;
        }, 1200);
      }
    } catch (_) {
      const temp = document.createElement("textarea");
      temp.value = value;
      temp.setAttribute("readonly", "");
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.append(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
    }
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
      { name: "registrationUrl", label: "報名表單網址", type: "copy-url", value: eventRegistrationUrl(item), wide: true },
      { name: "registrationNote", label: "報名注意事項", type: "textarea", value: item.registrationNote },
      { name: "detail", label: "活動詳情", type: "textarea", value: item.detail }
    ], (data) => saveEventWithRegistration(item, data), item.id ? () => deleteItem("event", item.id) : null);
  }

  function openEventRegistrationForm(item = {}) {
    if (!item.id) {
      alert("請先選擇一個活動，或先新增活動後再設定報名表單。");
      return;
    }
    const registrationUrl = buildEventRegistrationUrl(item.id, item.title, item.date);
    openModal("新增/設定報名表單", [
      { name: "title", label: "活動主題", value: item.title, wide: true },
      { name: "registrationEnabled", label: "報名表單", type: "select", options: selectOptions([{ value: "true", label: "開放報名" }, { value: "false", label: "不開放" }], String(item.registrationEnabled === false || item.registrationEnabled === "false" ? "false" : "true")) },
      { name: "registrationDeadline", label: "報名截止時間", type: "datetime-local", value: datetimeForInput(item.registrationDeadline) },
      { name: "registrationLimit", label: "報名名額上限", type: "number", value: item.registrationLimit },
      { name: "registrationUrl", label: "報名表單網址", type: "copy-url", value: registrationUrl, wide: true },
      { name: "registrationNote", label: "報名注意事項", type: "textarea", value: item.registrationNote }
    ], (data) => saveEventWithRegistration(item, { ...data, registrationEnabled: data.registrationEnabled || "true" }), null);
  }

  function buildEventRegistrationUrl(eventId, eventName, eventDate) {
    if (!eventId) return "";
    const base = "https://tseng-service.pages.dev/liff/event-registration/";
    const url = new URL(base);
    url.searchParams.set("eventId", eventId);
    if (eventName) url.searchParams.set("eventName", eventName);
    if (eventDate) url.searchParams.set("eventDate", formatDateTime(eventDate));
    return url.toString();
  }

  function eventRegistrationUrl(item = {}) {
    if (!item.registrationUrl) return buildEventRegistrationUrl(item.id, item.title, item.date);
    if (!item.title && !item.date) return item.registrationUrl;

    try {
      const url = new URL(item.registrationUrl);
      if (item.title) url.searchParams.set("eventName", item.title);
      if (item.date) url.searchParams.set("eventDate", formatDateTime(item.date));
      return url.toString();
    } catch (_) {
      return item.registrationUrl;
    }
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

  function openMemberForm(item = {}) {
    openModal(`編輯會員標籤：${item.name || item.lineName || "未命名會員"}`, [
      { name: "status", label: "狀態", value: item.status },
      { name: "attribute", label: "人員屬性", value: item.attribute },
      { name: "interactionTags", label: "互動記錄標籤", type: "textarea", value: memberTagText(item.interactionTags) },
      { name: "note", label: "備註", type: "textarea", value: item.note }
    ], (data) => AdminApi.saveMember({
      ...item,
      status: data.status,
      attribute: data.attribute,
      interactionTags: memberTagList(data.interactionTags),
      note: data.note
    }), null);
  }


  function openLineAccountForm(item = {}) {
    if (!isAdminUser()) return;
    openModal(`編輯 ${item.name || "LINE OA 設定"}`, [
      { name: "name", label: "OA 名稱", value: item.name, wide: true },
      { name: "enabled", label: "啟用狀態", type: "select", options: selectOptions([{ value: "true", label: "啟用" }, { value: "false", label: "停用" }], String(item.enabled === false || item.enabled === "false" ? "false" : "true")) },
      { name: "channelId", label: "Channel ID", value: item.channelId },
      { name: "basicId", label: "Basic ID", value: item.basicId },
      { name: "channelSecret", label: "Channel Secret", type: "password", value: "", placeholder: item.hasChannelSecret ? "已設定，留空不變" : "貼上 LINE Channel Secret", wide: true, autocomplete: "new-password" },
      { name: "channelAccessToken", label: "Channel Access Token", type: "password", value: "", placeholder: item.hasAccessToken ? "已設定，留空不變" : "貼上 long-lived Channel Access Token", wide: true, autocomplete: "new-password" },
      { name: "liffIds", label: "LIFF ID 清單（一行一個）", type: "textarea", value: lineList(item.liffIds || item.liffId).join("\n"), placeholder: "例如：2009640939-ACYipKCx" },
      { name: "webhookUrl", label: "Webhook URL", value: item.webhookUrl, wide: true },
      { name: "liffUrls", label: "LIFF URL 清單（一行一個）", type: "textarea", value: lineList(item.liffUrls).join("\n") },
      { name: "workflowName", label: "n8n workflow 名稱", value: item.workflowName },
      { name: "lastCheckedAt", label: "最後檢查時間", type: "datetime-local", value: datetimeForInput(item.lastCheckedAt) },
      { name: "purpose", label: "用途說明", type: "textarea", value: item.purpose },
      { name: "note", label: "備註", type: "textarea", value: item.note },
      { name: "tokenNotice", label: "安全提示", value: "Token 與 Secret 儲存後不會在後台回顯；欄位留空代表保留原值。", wide: true, readonly: true }
    ], (data) => AdminApi.saveLineAccount({
      ...item,
      ...data,
      key: item.key,
      accessTokenEnv: item.accessTokenEnv,
      channelSecretEnv: item.channelSecretEnv,
      hasAccessToken: item.hasAccessToken,
      hasChannelSecret: item.hasChannelSecret,
      liffIds: lineList(data.liffIds).join("\n"),
      liffUrls: lineList(data.liffUrls).join("\n")
    }), null);
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
    const closeDetail = event.target.closest("[data-close-detail]");
    if (closeDetail) {
      closeEventDetail();
      renderEvents();
      return;
    }
    const copyUrl = event.target.closest("[data-copy-url]");
    if (copyUrl) {
      copyText(copyUrl.dataset.copyUrl, copyUrl);
      return;
    }
    const openTask = event.target.closest("[data-open-task]");
    if (openTask) {
      const type = openTask.dataset.openTask;
      const id = openTask.dataset.id;
      if (type === "case") {
        state.selected.caseId = id;
        switchView("cases");
        renderCases();
      }
      if (type === "event") {
        const item = state.events.find((entry) => entry.id === id);
        state.selected.eventId = id;
        state.calendarDate = dateKeyFromValue(eventDateValue(item || {})) || state.calendarDate;
        switchView("events");
        showEvent(id);
      }
      if (type === "legal") {
        state.selected.legalId = id;
        switchView("legal");
        renderLegal();
      }
      return;
    }
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
      if (type === "member") openMemberForm(state.members.find((item) => item.id === id));
      if (type === "lineAccount") openLineAccountForm(mergeLineAccountDefaults(state.lineAccounts).find((item) => item.key === id));
    }
    if (del) deleteItem(del.dataset.delete, del.dataset.id);
    const preview = event.target.closest("[data-preview-image]");
    if (preview) openImagePreview(preview.dataset.previewImage);
  }

  function openLineAccountByKey(key) {
    const item = mergeLineAccountDefaults(state.lineAccounts).find((entry) => entry.key === key);
    openLineAccountForm(item || LINE_ACCOUNT_DEFAULTS.find((entry) => entry.key === key) || {});
  }

  function switchView(view) {
    if ((view === "staff" || view === "lineAccounts") && !isAdminUser()) return;
    els.navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
    els.panels.forEach((panel) => {
      const active = panel.id === `${view}View`;
      panel.classList.toggle("is-active", active);
      if (active) els.viewTitle.textContent = panel.dataset.title;
    });
    if (view === "lineAccounts") renderLineAccounts();
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

  const EXCEL_FIELD_MAP = {
    "請託案號": "caseNo",
    "請託日期": "requestDate",
    "託辦類別": "category",
    "接案秘書": "staff",
    "當事人名": "petitioner",
    "行動電話": "phone",
    "通訊地址": "address",
    "委託人名": "commissioner",
    "關係": "relation",
    "託辦事項": "content",
    "處理狀況": "status",
    "處理天數": "processingDays",
    "交辦會勘記錄": "inspectionNote"
  };

  function convertRocDate(value) {
    if (!value) return "";
    const str = String(value).trim();
    // 民國格式 115.0508 或 115/05/08
    const rocDot = str.match(/^(\d{2,3})[./](\d{2})[./](\d{2})$/);
    if (rocDot) {
      const year = parseInt(rocDot[1], 10) + 1911;
      return `${year}-${rocDot[2]}-${rocDot[3]}`;
    }
    // 民國格式 1150508（7碼，rocYear=115, mmdd=0508）
    const rocCompact = str.match(/^(\d{3})(\d{2})(\d{2})$/);
    if (rocCompact) {
      const year = parseInt(rocCompact[1], 10) + 1911;
      return `${year}-${rocCompact[2]}-${rocCompact[3]}`;
    }
    // ISO yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    // 西元 yyyy/m/d 或 yyyy/mm/dd
    const slashMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (slashMatch) {
      const [, y, m, d] = slashMatch;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return str;
  }

  function mapExcelRow(headers, row) {
    const result = {};
    headers.forEach((header, i) => {
      const field = EXCEL_FIELD_MAP[String(header || "").trim()];
      if (!field) return;
      let val = row[i];
      if (field === "requestDate") val = convertRocDate(val);
      if (field === "processingDays") val = val !== undefined && val !== "" ? Number(val) : undefined;
      result[field] = val !== undefined && val !== null ? String(val).trim() : "";
    });
    return result;
  }

  let importData = [];

  function toggleImportPanel() {
    const panel = document.getElementById("importPanel");
    if (!panel) return;
    const isHidden = panel.hidden;
    panel.hidden = !isHidden;
    if (isHidden) {
      document.getElementById("importPreviewWrap").hidden = true;
      document.getElementById("importStatus").textContent = "";
      importData = [];
    }
  }

  function processExcelFile(file) {
    if (!window.XLSX) { alert("SheetJS 尚未載入，請稍後再試。"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
      if (rows.length < 2) { document.getElementById("importStatus").textContent = "⚠️ 檔案無資料列"; return; }
      const headers = rows[0];
      const dataRows = rows.slice(1).filter((r) => r.some((v) => v !== ""));
      importData = dataRows.map((row) => mapExcelRow(headers, row));
      const requiredCols = ["請託案號"];
      const missing = requiredCols.filter((col) => !headers.includes(col));
      if (missing.length) {
        document.getElementById("importStatus").textContent = `⚠️ 缺少必要欄位：${missing.join("、")}`;
        return;
      }
      const previewWrap = document.getElementById("importPreviewWrap");
      document.getElementById("importPreviewTitle").textContent = `預覽（共 ${importData.length} 筆，顯示前 5 筆）`;
      const previewCols = ["請託案號", "請託日期", "託辦類別", "接案秘書", "當事人名", "處理狀況"];
      const visibleCols = previewCols.filter((col) => headers.includes(col));
      document.getElementById("importPreviewHead").innerHTML = `<tr>${visibleCols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
      document.getElementById("importPreviewBody").innerHTML = importData.slice(0, 5).map((item) =>
        `<tr>${visibleCols.map((col) => {
          const field = EXCEL_FIELD_MAP[col] || col;
          return `<td>${escapeHtml(String(item[field] || ""))}</td>`;
        }).join("")}</tr>`
      ).join("");
      document.getElementById("importStatus").textContent = "";
      previewWrap.hidden = false;
    };
    reader.readAsArrayBuffer(file);
  }

  async function runImport() {
    if (!importData.length) return;
    const statusEl = document.getElementById("importStatus");
    const confirmBtn = document.getElementById("importConfirmBtn");
    confirmBtn.disabled = true;
    let ok = 0;
    let fail = 0;
    for (const item of importData) {
      statusEl.textContent = `匯入中… ${ok + fail + 1} / ${importData.length}`;
      try {
        await AdminApi.saveCase(item);
        ok++;
      } catch (_) {
        fail++;
      }
    }
    statusEl.textContent = `✅ 完成：${ok} 筆成功${fail ? `，${fail} 筆失敗` : ""}`;
    confirmBtn.disabled = false;
    if (ok > 0) {
      clearCache();
      const cases = await AdminApi.listCases();
      state.cases = Array.isArray(cases) ? cases : [];
      renderCases();
    }
  }

  function bindImportEvents() {
    const dropZone = document.getElementById("importDropZone");
    const fileInput = document.getElementById("importFileInput");
    const browseBtn = document.getElementById("importBrowseBtn");
    const cancelBtn = document.getElementById("importCancelBtn");
    const confirmBtn = document.getElementById("importConfirmBtn");
    if (!dropZone) return;

    browseBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => { if (fileInput.files[0]) processExcelFile(fileInput.files[0]); });

    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("is-over"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-over"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("is-over");
      const file = e.dataTransfer.files[0];
      if (file) processExcelFile(file);
    });

    cancelBtn.addEventListener("click", () => {
      document.getElementById("importPreviewWrap").hidden = true;
      document.getElementById("importStatus").textContent = "";
      importData = [];
    });
    confirmBtn.addEventListener("click", runImport);
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
      const lineAccountEdit = event.target.closest('[data-edit="lineAccount"]');
      if (lineAccountEdit) {
        event.preventDefault();
        openLineAccountByKey(lineAccountEdit.dataset.id);
        return;
      }
      if (event.target.closest(".image-preview-close") || event.target.classList.contains("image-preview-layer")) closeImagePreview();
      if (event.target.closest(".drawer-backdrop")) {
        closeEventDetail();
        renderEvents();
      }
    });
    els.modalForm.addEventListener("submit", submitModal);
    [els.caseDetail, els.eventDetail, els.legalDetail, els.memberDetail, els.taskDetail, els.lineAccountsGrid].forEach((node) => node?.addEventListener("click", handleDetailClick));
    els.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
    els.calendarModeButtons.forEach((button) => button.addEventListener("click", () => {
      state.calendarMode = button.dataset.calendarMode || "month";
      if (!state.calendarDate) state.calendarDate = dateKeyFromDate(new Date());
      els.calendarModeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderEvents();
    }));
    els.calendarPrev.addEventListener("click", () => navigateCalendar(-1));
    els.calendarNext.addEventListener("click", () => navigateCalendar(1));
    els.calendarNavLabel.addEventListener("click", () => openMonthPicker());
    [els.caseSearch, els.caseStatusFilter].forEach((el) => el.addEventListener("input", () => { resetPage("cases"); renderCases(); }));
    els.eventStatusFilter.addEventListener("input", () => { resetPage("events"); renderEvents(); });
    [els.taskDate, els.taskTypeFilter, els.taskStatusFilter, els.taskStaffFilter].forEach((el) => el.addEventListener("input", renderTaskView));
    els.taskTodayButton.addEventListener("click", () => {
      els.taskDate.value = dateKeyFromDate(new Date());
      renderTaskView();
    });
    els.registrationEventSelect.addEventListener("change", (event) => loadEventRegistrations(event.target.value));
    els.refreshRegistrationsButton.addEventListener("click", () => loadEventRegistrations(els.registrationEventSelect.value));
    els.registrationsTable.addEventListener("click", (event) => {
      const cancelBtn = event.target.closest("[data-cancel-reg]");
      const restoreBtn = event.target.closest("[data-restore-reg]");
      if (cancelBtn) updateRegistrationStatus(cancelBtn.dataset.cancelReg, "cancelled");
      if (restoreBtn) updateRegistrationStatus(restoreBtn.dataset.restoreReg, "registered");
    });
    [els.legalSearch, els.legalStatusFilter, els.legalCategoryFilter].forEach((el) => el.addEventListener("input", () => { resetPage("legal"); renderLegal(); }));
    [els.memberSearch, els.memberTagFilter, els.memberAttributeFilter, els.memberStatusFilter].forEach((el) => el.addEventListener("input", () => { resetPage("members"); renderMembers(); }));
    els.staffSearch.addEventListener("input", () => { resetPage("staff"); renderStaff(); });
    els.addCaseButton.addEventListener("click", () => openCaseForm());
    const importBtn = document.getElementById("importCasesButton");
    if (importBtn) importBtn.addEventListener("click", toggleImportPanel);
    bindImportEvents();
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
    els.membersTable.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (row) showMember(row.dataset.id);
    });
    els.staffTable.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (row && isAdminUser()) openStaffForm(state.staff.find((item) => item.id === row.dataset.id));
    });
    els.calendarGrid.addEventListener("click", (event) => {
      const more = event.target.closest("[data-more-date]");
      if (more) {
        state.calendarDate = more.dataset.moreDate;
        openDayEventsModal(more.dataset.moreDate);
        renderEvents();
        return;
      }
      const button = event.target.closest("[data-event-id]");
      if (button) {
        showEvent(button.dataset.eventId);
        return;
      }
      const day = event.target.closest("[data-date]");
      if (day?.dataset.date) {
        state.calendarDate = day.dataset.date;
        renderEvents();
      }
    });
    els.taskList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-task-id]");
      if (button) showTask(button.dataset.taskType, button.dataset.taskId);
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (!button) return;
      const key = button.dataset.page;
      state.pages[key] += Number(button.dataset.dir);
      if (key === "cases") renderCases();
      if (key === "events") renderEvents();
      if (key === "registrations") renderRegistrations();
      if (key === "legal") renderLegal();
      if (key === "members") renderMembers();
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
