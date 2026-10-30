/* Account operations call Spring Boot; the demo business workspace stays in-memory. */
const AUTH_BASE = (window.PALM_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
let accessToken = null;

async function authRequest(method, path, body) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let response;
  try {
    response = await fetch(AUTH_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot connect to the Palm Advising API at ${AUTH_BASE}. Start the backend and serve the frontend over HTTP, then try again.`,
      );
    }
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }
  return data;
}

async function request(method, path, body) {
  return mock(method, path, body);
}

const api = {
  setAccessToken: token => { accessToken = token; },
  registerStudent: student => authRequest("POST", "/api/auth/register/student", student),
  login: credentials => authRequest("POST", "/api/auth/login", credentials),
  verifyEmail: token => authRequest("GET", `/api/auth/verify-email?token=${encodeURIComponent(token)}`),
  acceptInvitation: invitation => authRequest("POST", "/api/auth/accept-invitation", invitation),
  currentUser: () => authRequest("GET", "/api/auth/me"),
  studentProfile: () => authRequest("GET", "/api/students/me"),
  adviserProfile: () => authRequest("GET", "/api/advisers/me"),
  inviteAdviser: invitation => authRequest("POST", "/api/admin/advisers", invitation),
  dashboard: (id) => request("GET", `/api/advisors/${id}/dashboard`),
  progress: (id) => request("GET", `/api/students/${id}/progress`),
  addStudent: (s) => request("POST", "/api/students", s),
  addAdvisor: (a) => request("POST", "/api/advisors", a),
  assign: (studentId, advisorId) =>
    request("POST", `/api/students/${studentId}/advisor`, { advisorId }),
  addAction: (studentId, a) =>
    request("POST", `/api/students/${studentId}/actions`, a),
  bookSession: (s) => request("POST", "/api/sessions", s),
  updateSession: (id, status) =>
    request("PUT", `/api/sessions/${id}`, { status }),
  workload: () => request("GET", "/api/reports/workload"),
  flagged: () => request("GET", "/api/reports/flagged"),
};

/* ---------- Mock backend (in memory, resets on refresh) ---------- */
const db = {
  advisors: {
    A001: {
      id: "A001",
      name: "Dr. Mensah",
      max: 15,
      students: ["S001", "S002", "S003"],
    },
  },
  students: {
    S001: {
      id: "S001",
      name: "Ama Owusu",
      fails: 0,
      creditsEarned: 66,
      creditsRequired: 120,
      semesters: [
        { name: "Sem 1 2025", gpa: 3.2 },
        { name: "Sem 2 2025", gpa: 3.5 },
        { name: "Sem 1 2026", gpa: 3.6 },
      ],
      actionItems: [
        {
          description: "Join a study group",
          dueDate: "2026-12-01",
          done: false,
        },
      ],
      notes: [
        {
          date: "2026-09-20",
          text: "Settling in well. Considering a second major.",
        },
      ],
    },
    S002: {
      id: "S002",
      name: "Kofi Baah",
      fails: 1,
      creditsEarned: 54,
      creditsRequired: 120,
      semesters: [
        { name: "Sem 1 2025", gpa: 2.9 },
        { name: "Sem 2 2025", gpa: 2.6 },
        { name: "Sem 1 2026", gpa: 2.2 },
      ],
      actionItems: [
        { description: "Retake COSC201", dueDate: "2026-09-30", done: false },
      ],
      notes: [
        {
          date: "2026-10-02",
          text: "Struggling with programming. Agreed on a retake plan.",
        },
      ],
    },
    S003: {
      id: "S003",
      name: "Yaa Tetteh",
      fails: 3,
      creditsEarned: 36,
      creditsRequired: 120,
      semesters: [
        { name: "Sem 1 2025", gpa: 1.8 },
        { name: "Sem 2 2025", gpa: 1.4 },
      ],
      actionItems: [],
      notes: [],
    },
  },
  sessions: [],
};

const gpaOf = (s) =>
  s.semesters.reduce((t, x) => t + x.gpa, 0) / (s.semesters.length || 1);
function standing(s) {
  const g = gpaOf(s);
  if (g < 1.5 || s.fails >= 3) return "PROBATION";
  if (g < 2.5 || s.fails >= 1) return "AT_RISK";
  return "ON_TRACK";
}
const today = () => new Date().toISOString().slice(0, 10);
const overdue = (s) =>
  s.actionItems.filter((a) => !a.done && a.dueDate < today()).length;
const fail = (msg) => {
  throw new Error(msg);
};

async function mock(method, path, body) {
  await new Promise((r) => setTimeout(r, 120));
  let m;
  const find = (id) => db.students[id] || fail(`No student with ID ${id}.`);
  if (
    method === "GET" &&
    (m = path.match(/^\/api\/advisors\/(\w+)\/dashboard$/))
  ) {
    const a = db.advisors[m[1]] || fail(`No advisor with ID ${m[1]}.`);
    return {
      advisor: { id: a.id, name: a.name },
      advisees: a.students.map((id) => {
        const s = db.students[id];
        return {
          id,
          name: s.name,
          cgpa: gpaOf(s),
          standing: standing(s),
          creditPercent: Math.round(
            (100 * s.creditsEarned) / s.creditsRequired,
          ),
          overdueItems: overdue(s),
        };
      }),
    };
  }
  if (
    method === "GET" &&
    (m = path.match(/^\/api\/students\/(\w+)\/progress$/))
  ) {
    const s = find(m[1]);
    return { ...s, cgpa: gpaOf(s), standing: standing(s) };
  }
  if (method === "POST" && path === "/api/students") {
    if (db.students[body.id]) fail(`Student ID ${body.id} already exists.`);
    db.students[body.id] = {
      ...body,
      fails: 0,
      creditsEarned: 0,
      creditsRequired: 120,
      semesters: [],
      actionItems: [],
      notes: [],
    };
    return body;
  }
  if (method === "POST" && path === "/api/advisors") {
    if (db.advisors[body.id]) fail(`Advisor ID ${body.id} already exists.`);
    db.advisors[body.id] = { ...body, max: 15, students: [] };
    return body;
  }
  if (
    method === "POST" &&
    (m = path.match(/^\/api\/students\/(\w+)\/advisor$/))
  ) {
    find(m[1]);
    const a =
      db.advisors[body.advisorId] ||
      fail(`No advisor with ID ${body.advisorId}.`);
    if (a.students.length >= a.max)
      fail(`${a.name} already has ${a.max} advisees.`);
    a.students.push(m[1]);
    return {};
  }
  if (
    method === "POST" &&
    (m = path.match(/^\/api\/students\/(\w+)\/actions$/))
  ) {
    find(m[1]).actionItems.push({ ...body, done: false });
    return {};
  }
  if (method === "POST" && path === "/api/sessions") {
    find(body.studentId);
    db.advisors[body.advisorId] ||
      fail(`No advisor with ID ${body.advisorId}.`);
    const id = "SES" + (db.sessions.length + 1);
    db.sessions.push({ id, ...body, status: "REQUESTED" });
    return { id };
  }
  if (method === "PUT" && (m = path.match(/^\/api\/sessions\/(\w+)$/))) {
    (
      db.sessions.find((x) => x.id === m[1]) ||
      fail(`No session with ID ${m[1]}.`)
    ).status = body.status;
    return {};
  }
  if (method === "GET" && path === "/api/reports/workload")
    return Object.values(db.advisors).map((a) => ({
      id: a.id,
      name: a.name,
      advisees: a.students.length,
      max: a.max,
    }));
  if (method === "GET" && path === "/api/reports/flagged")
    return Object.values(db.students)
      .filter((s) => standing(s) !== "ON_TRACK")
      .map((s) => ({
        id: s.id,
        name: s.name,
        cgpa: gpaOf(s),
        standing: standing(s),
      }));
  fail("Unknown endpoint: " + method + " " + path);
}
