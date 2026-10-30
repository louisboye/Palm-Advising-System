const MAX_GPA = 4.0; // change to 5.0 if your grading scale is out of 5
const LABEL = {
  ON_TRACK: "On track",
  AT_RISK: "At risk",
  PROBATION: "Probation",
};
const RANK = { PROBATION: 0, AT_RISK: 1, ON_TRACK: 2 };

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const badge = (s) =>
  `<span class="badge ${esc(s)}">${LABEL[s] || esc(s)}</span>`;

/* ---------- Icons and pictures (inline SVG, no downloads needed) ---------- */
const PATHS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  userplus:
    '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M19 8v6M16 11h6"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  report:
    '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2l-5.5 3 1-6.2L3 9.6l6.2-.9z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
  note: '<path d="M4 4h16v12H8l-4 4z"/>',
  group:
    '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 14c3 0 6 2 6 5"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3l-.2.1h-2.8l-.1-.2a1.7 1.7 0 0 0-3.2 0l-.1.2H6.6l-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1a1.7 1.7 0 0 0 .3-1.9l-.1-.2v-2.8l.2-.1a1.7 1.7 0 0 0 0-3.2l-.2-.1V5.8l.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.9.3l.2-.1h2.8l.1.2a1.7 1.7 0 0 0 3.2 0l.1-.2h2.8l.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9l.1.2v2.8l-.2.1a1.7 1.7 0 0 0 0 3.2l.2.1v2.8z"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
};
const ico = (n) =>
  `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${PATHS[n] || ""}</svg>`;

const ART = `<svg viewBox="0 0 160 130" aria-hidden="true">
  <circle cx="80" cy="66" r="56" fill="#fff" opacity=".18"/>
  <rect x="28" y="106" width="104" height="14" rx="4" fill="#FFC94D"/>
  <rect x="38" y="92" width="86" height="14" rx="4" fill="#4ECDC4"/>
  <rect x="32" y="78" width="94" height="14" rx="4" fill="#FF8A8A"/>
  <path d="M52 52v14c0 6 12 10 28 10s28-4 28-10V52l-28 10z" fill="#C7D3FF"/>
  <path d="M80 18l52 22-52 22-52-22z" fill="#fff"/>
  <path d="M132 40v26" stroke="#FFC94D" stroke-width="3" stroke-linecap="round"/><circle cx="132" cy="69" r="5" fill="#FFC94D"/>
</svg>`;

const COLORS = [
  "#3558D6",
  "#12A594",
  "#7B4FD6",
  "#E8A000",
  "#E8575A",
  "#1F9D61",
];
function avatar(name, big = false) {
  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const color =
    COLORS[
      [...String(name)].reduce((t, c) => t + c.charCodeAt(0), 0) % COLORS.length
    ];
  return `<span class="avatar${big ? " lg" : ""}" style="background:${color}" aria-hidden="true">${esc(initials)}</span>`;
}
const barColor = (g) =>
  g >= 3 ? "#1F9D61" : g >= 2.5 ? "#3558D6" : g >= 2 ? "#E8A000" : "#E8575A";
const emptyState = (icon, msg) =>
  `<div class="empty-state">${ico(icon)}<p>${esc(msg)}</p></div>`;
const isoToday = () => new Date().toISOString().slice(0, 10);
const tile = (cls, icon, n, label) =>
  `<div class="tile ${cls}"><span class="chip">${ico(icon)}</span><div><strong>${n}</strong><span class="l">${label}</span></div></div>`;

document
  .querySelectorAll("[data-icon]")
  .forEach((el) => el.insertAdjacentHTML("afterbegin", ico(el.dataset.icon)));
document.querySelectorAll("[data-art]").forEach((el) => (el.innerHTML = ART));

/* ---------- Toast ---------- */
let toastTimer;
function toast(message, isError = false) {
  const t = $("#toast");
  t.textContent = message;
  t.className = "show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ""), 3500);
}

/* ---------- Navigation ---------- */
let currentRole = "adviser";
let currentScreen = "auth";
let activeUser = null;
const ROLE_DEFAULT_VIEW = { student: "progress", admin: "register", adviser: "dashboard" };
const allowedRoles = (element) => element.dataset.roles.split(/\s+/);

function setRole(role) {
  currentRole = role;
  $("#prog-form").reset();
  $("#prog-out").innerHTML =
    '<div class="empty-state"><p>Enter a student ID to view grades, credits, and action items.</p></div>';
  document.querySelectorAll(".workspace-option").forEach((button) => {
    const selected = button.dataset.role === role;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelectorAll("#nav button").forEach((button) => {
    button.hidden = !allowedRoles(button).includes(role);
  });
  document.querySelectorAll("[data-roles]:not(#nav button)").forEach((element) => {
    element.hidden = !allowedRoles(element).includes(role);
  });
  show(ROLE_DEFAULT_VIEW[role]);
}

function show(view) {
  const navButton = [...document.querySelectorAll("#nav button")].find(
    (button) => button.dataset.view === view,
  );
  if (!navButton || !allowedRoles(navButton).includes(currentRole)) {
    show(ROLE_DEFAULT_VIEW[currentRole]);
    return;
  }
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.toggle("active", v.id === view));
  document
    .querySelectorAll("#nav button")
    .forEach((b) => {
      const active = b.dataset.view === view;
      b.classList.toggle("active", active);
      if (active) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
  if (view === "reports") loadReports();
}
document
  .querySelectorAll("#nav button")
  .forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));
document.querySelectorAll(".workspace-option").forEach((button) => {
  button.addEventListener("click", () => setRole(button.dataset.role));
});
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  if (currentScreen === "demo") show(ROLE_DEFAULT_VIEW[currentRole]);
  else if (currentScreen === "account" && activeUser) loadAccountDashboard(activeUser);
  else setScreen("auth");
});

/* ---------- Real account access ---------- */
const AUTH_SESSION_KEY = "palm.auth.session";
const ROLE_NAMES = { STUDENT: "Student", ADVISER: "Adviser", ADMIN: "Administrator" };
const LOGIN_ROLE_HELP = {
  STUDENT: "Sign in with your verified student account.",
  ADVISER: "Sign in with the password you set from your adviser invitation.",
  ADMIN: "Sign in with your provisioned administrator account.",
};
let selectedLoginRole = "STUDENT";
const isLocalMachine = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);

async function loadLocalAdminCredentials() {
  if (!isLocalMachine) return;

  try {
    const response = await fetch("./local-admin.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Local credentials are not configured.");
    const credentials = await response.json();
    if (
      typeof credentials.email !== "string" ||
      typeof credentials.password !== "string" ||
      !credentials.email ||
      !credentials.password
    ) {
      throw new Error("Local credentials are not configured.");
    }
    $("#local-admin-email").textContent = credentials.email;
    $("#local-admin-password").textContent = credentials.password;
    $("#local-admin-status").textContent =
      "If this is the first run, start PostgreSQL and the backend to create the account.";
  } catch {
    $("#local-admin-status").textContent =
      "Local credentials are unavailable. Check backend/.env and files/local-admin.json.";
  }
}

function setScreen(screen) {
  currentScreen = screen;
  $("#auth-view").classList.toggle("active", screen === "auth");
  $("#account-dashboard").classList.toggle("active", screen === "account");
  $("#account-dashboard").hidden = screen !== "account";
  $("#demo-workspace").hidden = screen !== "demo";
  $("#nav").hidden = screen !== "demo";
  $("#auth-toggle").hidden = screen !== "demo";
  $("#account-chip").hidden = screen !== "account";
  $("#logout-button").hidden = screen !== "account";
  $(".environment-tag").hidden = screen !== "demo";
  $("#footer-status").textContent = screen === "demo"
    ? "Palm Academic Advising · Demo workspace with synthetic data"
    : screen === "account"
      ? "Palm Academic Advising · Authenticated account"
      : "Palm Academic Advising · Secure account access";
}

function clearAccountSession(showSignIn = true) {
  api.setAccessToken(null);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  activeUser = null;
  $("#invite-form").hidden = true;
  $("#account-chip").textContent = "";
  if (showSignIn) setScreen("auth");
}

function addProfileField(label, value) {
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value == null || value === "" ? "Not provided" : String(value);
  $("#profile-details").append(term, description);
}

async function loadAccountDashboard(user) {
  const role = user.role;
  const roleName = ROLE_NAMES[role];
  if (!roleName) throw new Error("This account has an unsupported role.");

  let profile = user;
  if (role === "STUDENT") profile = await api.studentProfile();
  if (role === "ADVISER") profile = await api.adviserProfile();
  activeUser = user;

  $("#account-name").textContent = profile.fullName || user.fullName;
  $("#account-role-label").textContent = `${roleName.toUpperCase()} WORKSPACE`;
  $("#account-role-pill").textContent = roleName;
  $("#account-chip").textContent = `${profile.fullName || user.fullName} · ${roleName}`;
  $("#profile-details").replaceChildren();
  addProfileField("Name", profile.fullName || user.fullName);
  addProfileField("Email", profile.email || user.email);
  addProfileField("Account type", roleName);
  if (role === "STUDENT") {
    addProfileField("Student number", profile.studentNumber);
    addProfileField("Programme", profile.programme);
    addProfileField("Level", profile.level);
    $("#account-intro").textContent = "This is your private student workspace. Only your account can access this profile.";
    $("#account-notice").textContent = "Your account is connected. Academic progress, appointments, and advising records will appear here as those backend modules are implemented.";
  } else if (role === "ADVISER") {
    addProfileField("Department", profile.department);
    $("#account-intro").textContent = "This is your adviser workspace. Your profile is available to your signed-in account.";
    $("#account-notice").textContent = "Your adviser account is active. Assigned students, advising sessions, and follow-up tools are not yet connected to this backend.";
  } else {
    $("#account-intro").textContent = "Manage adviser onboarding from your administrator workspace.";
    $("#account-notice").textContent = "Administrator accounts are provisioned securely. Student, assignment, session, and reporting management endpoints are still under development.";
  }
  $("#invite-form").hidden = role !== "ADMIN";
  setScreen("account");
}

function persistAccountSession(loginResponse) {
  const expiresAt = Date.now() + loginResponse.expiresIn * 1000;
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
    accessToken: loginResponse.accessToken,
    expiresAt,
  }));
}

onSubmit("#login-form", async (formData, form) => {
  const expectedRole = selectedLoginRole;
  const response = await api.login({
    email: formData.email.trim(),
    password: formData.password,
  });
  api.setAccessToken(response.accessToken);
  try {
    const user = await api.currentUser();
    if (user.role !== expectedRole) {
      throw new Error(
        `This account is for ${ROLE_NAMES[user.role] || "another role"}. Choose ${ROLE_NAMES[user.role] || "the matching account type"} and sign in again.`,
      );
    }
    await loadAccountDashboard(user);
    persistAccountSession(response);
    form.reset();
  } catch (error) {
    clearAccountSession();
    throw error;
  }
});

onSubmit("#student-registration-form", async (formData, form) => {
  const response = await api.registerStudent({
    ...formData,
    email: formData.email.trim(),
    fullName: formData.fullName.trim(),
    studentNumber: formData.studentNumber.trim(),
    programme: formData.programme.trim(),
    level: Number(formData.level),
  });
  form.reset();
  toast(response.message || "Registration submitted. Check your email to verify your account.");
});

onSubmit("#invite-form", async (formData, form) => {
  const response = await api.inviteAdviser({
    ...formData,
    email: formData.email.trim(),
    fullName: formData.fullName.trim(),
    department: formData.department.trim(),
  });
  form.reset();
  toast(response.message || "Adviser invitation sent.");
});

$("#demo-toggle").addEventListener("click", () => setScreen("demo"));
$("#auth-toggle").addEventListener("click", () => setScreen("auth"));
function setAuthMode(mode) {
  const registering = mode === "register";
  $("#auth-card").classList.toggle("registration-active", registering);
  $("#login-form").inert = registering;
  $("#login-form").setAttribute("aria-hidden", String(registering));
  $("#student-registration-form").inert = !registering;
  $("#student-registration-form").setAttribute("aria-hidden", String(!registering));
  const activeTitle = $(registering ? "#student-signup-title" : "#login-title");
  activeTitle.getBoundingClientRect();
  activeTitle.focus({ preventScroll: true });
}
document.querySelectorAll("[data-login-role]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedLoginRole = button.dataset.loginRole;
    document.querySelectorAll("[data-login-role]").forEach((option) => {
      const selected = option === button;
      option.classList.toggle("selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
    $("#login-role-hint").textContent = LOGIN_ROLE_HELP[selectedLoginRole];
    const credentialsPanel = $("#local-admin-credentials");
    credentialsPanel.hidden = !isLocalMachine || selectedLoginRole !== "ADMIN";
  });
});
$("#switch-to-register").addEventListener("click", () => setAuthMode("register"));
$("#switch-to-login").addEventListener("click", () => setAuthMode("login"));
$("#logout-button").addEventListener("click", () => {
  clearAccountSession();
  toast("You have signed out.");
});

async function restoreAccountSession() {
  const saved = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!saved) return;
  try {
    const session = JSON.parse(saved);
    if (!session.accessToken || session.expiresAt <= Date.now()) {
      clearAccountSession();
      return;
    }
    api.setAccessToken(session.accessToken);
    const user = await api.currentUser();
    await loadAccountDashboard(user);
  } catch (error) {
    clearAccountSession();
    toast(`Your saved session could not be restored. Please sign in again. ${error.message}`, true);
  }
}

setRole(currentRole);
setScreen("auth");
loadLocalAdminCredentials();
restoreAccountSession();

/* ---------- Form helper: read fields, run action, show errors ---------- */
function onSubmit(formId, action) {
  $(formId).addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"], button:not([type])');
    const roleButtons = form.querySelectorAll("[data-login-role]");
    if (submitButton?.disabled) return;
    if (submitButton) submitButton.disabled = true;
    roleButtons.forEach((button) => { button.disabled = true; });
    try {
      await action(Object.fromEntries(new FormData(form)), form);
    } catch (err) {
      toast(err.message, true);
    } finally {
      if (submitButton) submitButton.disabled = false;
      roleButtons.forEach((button) => { button.disabled = false; });
    }
  });
}

/* ---------- Dashboard ---------- */
async function loadDashboard(id) {
  const data = await api.dashboard(id);
  const rows = [...data.advisees].sort(
    (a, b) => RANK[a.standing] - RANK[b.standing],
  );
  const count = (s) => rows.filter((r) => r.standing === s).length;
  $("#dash-out").innerHTML = !rows.length
    ? emptyState(
        "group",
        `${data.advisor.name} has no advisees yet. Assign students on the Register tab.`,
      )
    : `<div class="tiles">
         ${tile("t-blue", "group", rows.length, "Advisees")}
         ${tile("t-green", "check", count("ON_TRACK"), "On track")}
         ${tile("t-amber", "warn", count("AT_RISK"), "At risk")}
         ${tile("t-red", "alert", count("PROBATION"), "On probation")}
       </div>
       <div class="table-wrap"><table>
         <tr><th>Student</th><th>CGPA</th><th>Credits</th><th>Overdue items</th><th>Standing</th><th></th></tr>
         ${rows
           .map(
             (r) => `<tr>
           <td><div class="who">${avatar(r.name)}<div>${esc(r.name)}<small>${esc(r.id)}</small></div></div></td>
           <td>${r.cgpa.toFixed(2)}</td>
           <td>${r.creditPercent}%</td>
           <td>${r.overdueItems || "None"}</td>
           <td>${badge(r.standing)}</td>
           <td><button class="link" data-student="${esc(r.id)}">View progress</button></td>
         </tr>`,
           )
           .join("")}
       </table></div>`;
}
onSubmit("#dash-form", (f) => loadDashboard(f.id.trim()));
$("#dash-out").addEventListener("click", (e) => {
  const id = e.target.dataset.student;
  if (!id) return;
  $("#prog-id").value = id;
  show("progress");
  loadProgress(id).catch((err) => toast(err.message, true));
});

/* ---------- Student progress ---------- */
async function loadProgress(id) {
  const s = await api.progress(id);
  const pct = Math.round((100 * s.creditsEarned) / s.creditsRequired);
  const alerts = [];
  const sem = s.semesters;
  if (sem.length >= 2 && sem[sem.length - 1].gpa < sem[sem.length - 2].gpa)
    alerts.push(
      `GPA dropped from ${sem[sem.length - 2].gpa.toFixed(2)} to ${sem[sem.length - 1].gpa.toFixed(2)} last semester.`,
    );
  const late = s.actionItems.filter((a) => !a.done && a.dueDate < isoToday());
  if (late.length)
    alerts.push(
      `${late.length} action item${late.length > 1 ? "s are" : " is"} overdue.`,
    );

  const isStudent = currentRole === "student";
  $("#prog-out").innerHTML = `
    <div class="head">${avatar(s.name, true)}<div><h2>${esc(s.name)}</h2><small>${esc(s.id)}</small></div>${isStudent ? "" : badge(s.standing)}</div>
    ${isStudent ? "" : alerts.map((a) => `<div class="alert" role="alert">${ico("warn")}${esc(a)}</div>`).join("")}
    <div class="stats">
      <div class="card stat c-amber"><span class="chip" style="background:#FFF0C7;color:#B77A00">${ico("star")}</span>
        <div><strong>${s.cgpa.toFixed(2)}</strong><span class="l">Cumulative GPA (out of ${MAX_GPA.toFixed(1)})</span></div></div>
      <div class="card stat c-teal"><span class="chip" style="background:#D9F4F0;color:#12A594">${ico("target")}</span>
        <div><strong>${pct}%</strong><span class="l">${s.creditsEarned} of ${s.creditsRequired} credits earned</span>
        <div class="path" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div></div>
    </div>
    <h3>GPA by semester</h3>
    <div class="card">${
      sem.length
        ? `<div class="cols">${sem
            .map(
              (x) =>
                `<div class="col"><b>${x.gpa.toFixed(2)}</b><i style="height:${Math.min(100, (100 * x.gpa) / MAX_GPA)}%;background:${barColor(x.gpa)}"></i>${esc(x.name)}</div>`,
            )
            .join("")}</div>`
        : `${emptyState("chart", "No semester results recorded yet.")}`
    }</div>
    <h3>Action items</h3>
    <div class="card">
      <ul class="plain">${
        s.actionItems.length
          ? s.actionItems
              .map(
                (
                  a,
                ) => `<li><span class="dot ${a.done ? "ok" : ""}">${ico(a.done ? "check" : "flag")}</span>
        <div class="${a.done ? "done" : ""}">${esc(a.description)}<br><small>Due ${esc(a.dueDate)}</small>
        ${!a.done && a.dueDate < isoToday() ? ' <span class="overdue">Overdue</span>' : ""}</div></li>`,
              )
              .join("")
          : `<li class="empty">No action items yet. Add one below.</li>`
      }</ul>
      ${isStudent ? "" : `<form id="action-form" class="row" style="margin:16px 0 0">
        <label>New action item <input name="description" required></label>
        <label>Due date <input name="dueDate" type="date" required></label>
        <button class="primary">Add action item</button>
      </form>`}
    </div>
    ${isStudent ? "" : `<h3>Private session notes</h3>
    <div class="card"><ul class="plain">${
      s.notes.length
        ? s.notes
            .map(
              (n) =>
                `<li><span class="dot note">${ico("note")}</span><div><strong>${esc(n.date)}</strong><br>${esc(n.text)}</div></li>`,
            )
            .join("")
        : `<li class="empty">No session notes yet.</li>`
    }</ul></div>`}`;

  if (!isStudent) {
    $("#action-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api.addAction(id, Object.fromEntries(new FormData(e.target)));
        toast("Action item added");
        loadProgress(id);
      } catch (err) {
        toast(err.message, true);
      }
    });
  }
}
onSubmit("#prog-form", (f) => loadProgress(f.id.trim()));

/* ---------- Register ---------- */
onSubmit("#student-form", async (f, form) => {
  await api.addStudent({ ...f, level: Number(f.level) });
  toast("Student registered");
  form.reset();
});
onSubmit("#advisor-form", async (f, form) => {
  await api.addAdvisor(f);
  toast("Advisor registered");
  form.reset();
});
onSubmit("#assign-form", async (f, form) => {
  await api.assign(f.studentId.trim(), f.advisorId.trim());
  toast("Advisor assigned");
  form.reset();
});

/* ---------- Sessions ---------- */
onSubmit("#book-form", async (f, form) => {
  const res = await api.bookSession(f);
  toast(`Session booked${res.id ? " (ID " + res.id + ")" : ""}`);
  form.reset();
});
onSubmit("#status-form", async (f, form) => {
  await api.updateSession(f.id.trim(), f.status);
  toast("Session updated");
  form.reset();
});

/* ---------- Reports ---------- */
async function loadReports() {
  try {
    const [work, flagged] = await Promise.all([api.workload(), api.flagged()]);
    $("#report-out").innerHTML = `
      <h3 style="margin-top:0">Advisor workload</h3>
      <div class="table-wrap"><table><tr><th>Advisor</th><th>Advisees</th><th>Capacity</th></tr>
        ${work
          .map(
            (
              a,
            ) => `<tr><td><div class="who">${avatar(a.name)}<div>${esc(a.name)}<small>${esc(a.id)}</small></div></div></td><td>${a.advisees} of ${a.max}</td>
          <td><div class="path" style="width:160px"><i style="width:${Math.min(100, (100 * a.advisees) / a.max)}%"></i></div></td></tr>`,
          )
          .join("")}
      </table></div>
      <h3>Flagged students</h3>
      ${
        flagged.length
          ? `<div class="table-wrap"><table><tr><th>Student</th><th>CGPA</th><th>Standing</th></tr>
        ${flagged.map((s) => `<tr><td><div class="who">${avatar(s.name)}<div>${esc(s.name)}<small>${esc(s.id)}</small></div></div></td><td>${s.cgpa.toFixed(2)}</td><td>${badge(s.standing)}</td></tr>`).join("")}
      </table></div>`
          : `${emptyState("check", "No students are flagged right now.")}`
      }`;
  } catch (err) {
    toast(err.message, true);
  }
}
