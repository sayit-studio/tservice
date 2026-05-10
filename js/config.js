window.ADMIN_CONFIG = {
  useMockData: false,
  webhookBaseUrl: "https://drwu.zeabur.app/webhook",
  endpoints: {
    login: "/admin-auth-staff",
    casesList: "/admin-cases",
    eventsList: "/admin-events",
    eventRegistrationsList: "/admin-event-registrations",
    legalList: "/admin-legal-consultation",
    membersList: "/admin-members",
    staffList: "/admin-auth-staff"
  },
  notionDatabases: {
    events: "2cab3ad1d1cd804aa922caf1a7621f78",
    eventRegistrations: "350b3ad1d1cd8094aaa3fb6bbf6c6d34",
    cases: "29cb3ad1d1cd80da82b5fddde82ebe4d",
    staff: "350b3ad1d1cd801797a7dcf6f06c7f13",
    members: "292b3ad1d1cd8075b2d5e86e08d3d68f",
    legalConsultation: "2ccb3ad1d1cd8175aba6e21110f71145"
  }
};
