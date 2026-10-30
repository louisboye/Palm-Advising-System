const MAX_GPA = 4.0; // change to 5.0 if your grading scale is out of 5
const LABEL = { ON_TRACK: "On track", AT_RISK: "At risk", PROBATION: "Probation" };
const RANK = { PROBATION: 0, AT_RISK: 1, ON_TRACK: 2 };

const $ = (sel, root = document) => root.querySelector(sel);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const badge = s => `<span class="badge ${esc(s)}">${LABEL[s] || esc(s)}</span>`;

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
function show(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === view));
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  if (view === "reports") loadReports();
}
document.querySelectorAll("#nav button").forEach(b => b.addEventListener("click", () => show(b.dataset.view)));

/* ---------- Form helper: read fields, run action, show errors ---------- */
function onSubmit(formId, action) {
  $(formId).addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target;
    try {
      await action(Object.fromEntries(new FormData(form)), form);
    } catch (err) {
      toast(err.message, true);
    }
  });
}

/* ---------- Dashboard ---------- */
async function loadDashboard(id) {
  const data = await api.dashboard(id);
  const rows = [...data.advisees].sort((a, b) => RANK[a.standing] - RANK[b.standing]);
  $("#dash-out").innerHTML = !rows.length
    ? `<p class="empty">${esc(data.advisor.name)} has no advisees yet. Assign students on the Register tab.</p>`
    : `<h2>${esc(data.advisor.name)}: ${rows.length} advisees</h2>
       <div class="table-wrap"><table>
         <tr><th>Student</th><th>CGPA</th><th>Credits</th><th>Overdue items</th><th>Standing</th><th></th></tr>
         ${rows.map(r => `<tr>
           <td>${esc(r.name)} (${esc(r.id)})</td>
           <td>${r.cgpa.toFixed(2)}</td>
           <td>${r.creditPercent}%</td>
           <td>${r.overdueItems || "None"}</td>
           <td>${badge(r.standing)}</td>
           <td><button class="link" data-student="${esc(r.id)}">View progress</button></td>
         </tr>`).join("")}
       </table></div>`;
}
onSubmit("#dash-form", f => loadDashboard(f.id.trim()));
$("#dash-out").addEventListener("click", e => {
  const id = e.target.dataset.student;
  if (!id) return;
  $("#prog-id").value = id;
  show("progress");
  loadProgress(id).catch(err => toast(err.message, true));
});

/* ---------- Student progress ---------- */
async function loadProgress(id) {
  const s = await api.progress(id);
  const pct = Math.round(100 * s.creditsEarned / s.creditsRequired);
  const alerts = [];
  const sem = s.semesters;
  if (sem.length >= 2 && sem[sem.length - 1].gpa < sem[sem.length - 2].gpa)
    alerts.push(`GPA dropped from ${sem[sem.length - 2].gpa.toFixed(2)} to ${sem[sem.length - 1].gpa.toFixed(2)} last semester.`);
  const late = s.actionItems.filter(a => !a.done && a.dueDate < new Date().toISOString().slice(0, 10));
  if (late.length) alerts.push(`${late.length} action item${late.length > 1 ? "s are" : " is"} overdue.`);

  $("#prog-out").innerHTML = `
    <div class="head"><h2>${esc(s.name)}</h2><span>${esc(s.id)}</span>${badge(s.standing)}</div>
    ${alerts.map(a => `<div class="alert" role="alert">${esc(a)}</div>`).join("")}
    <div class="stats">
      <div class="card stat"><strong>${s.cgpa.toFixed(2)}</strong><span>Cumulative GPA (out of ${MAX_GPA.toFixed(1)})</span></div>
      <div class="card stat"><strong>${pct}%</strong><span>${s.creditsEarned} of ${s.creditsRequired} credits earned</span>
        <div class="path" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>
    </div>
    <h3>GPA by semester</h3>
    <div class="card">${sem.length ? `<div class="cols">${sem.map(x =>
      `<div class="col"><b>${x.gpa.toFixed(2)}</b><i style="height:${Math.min(100, 100 * x.gpa / MAX_GPA)}%"></i>${esc(x.name)}</div>`).join("")}</div>`
      : `<p class="empty">No semester results recorded yet.</p>`}</div>
    <h3>Action items</h3>
    <div class="card">
      <ul class="plain">${s.actionItems.length ? s.actionItems.map(a => `<li class="${a.done ? "done" : ""}">
        ${esc(a.description)}, due ${esc(a.dueDate)}
        ${!a.done && a.dueDate < new Date().toISOString().slice(0, 10) ? '<span class="overdue"> Overdue</span>' : ""}</li>`).join("")
        : `<li class="empty">No action items yet.</li>`}</ul>
      <form id="action-form" class="row" style="margin:16px 0 0">
        <label>New action item <input name="description" required></label>
        <label>Due date <input name="dueDate" type="date" required></label>
        <button class="primary">Add action item</button>
      </form>
    </div>
    <h3>Session notes</h3>
    <div class="card"><ul class="plain">${s.notes.length ? s.notes.map(n =>
      `<li><strong>${esc(n.date)}</strong>: ${esc(n.text)}</li>`).join("") : `<li class="empty">No session notes yet.</li>`}</ul></div>`;

  $("#action-form").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      await api.addAction(id, Object.fromEntries(new FormData(e.target)));
      toast("Action item added");
      loadProgress(id);
    } catch (err) { toast(err.message, true); }
  });
}
onSubmit("#prog-form", f => loadProgress(f.id.trim()));

/* ---------- Register ---------- */
onSubmit("#student-form", async (f, form) => {
  await api.addStudent({ ...f, level: Number(f.level) });
  toast("Student registered"); form.reset();
});
onSubmit("#advisor-form", async (f, form) => {
  await api.addAdvisor(f);
  toast("Advisor registered"); form.reset();
});
onSubmit("#assign-form", async (f, form) => {
  await api.assign(f.studentId.trim(), f.advisorId.trim());
  toast("Advisor assigned"); form.reset();
});

/* ---------- Sessions ---------- */
onSubmit("#book-form", async (f, form) => {
  const res = await api.bookSession(f);
  toast(`Session booked${res.id ? " (ID " + res.id + ")" : ""}`); form.reset();
});
onSubmit("#status-form", async (f, form) => {
  await api.updateSession(f.id.trim(), f.status);
  toast("Session updated"); form.reset();
});

/* ---------- Reports ---------- */
async function loadReports() {
  try {
    const [work, flagged] = await Promise.all([api.workload(), api.flagged()]);
    $("#report-out").innerHTML = `
      <h2>Advisor workload</h2>
      <div class="table-wrap"><table><tr><th>Advisor</th><th>Advisees</th><th>Capacity</th></tr>
        ${work.map(a => `<tr><td>${esc(a.name)} (${esc(a.id)})</td><td>${a.advisees} of ${a.max}</td>
          <td><div class="path" style="width:160px"><i style="width:${Math.min(100, 100 * a.advisees / a.max)}%"></i></div></td></tr>`).join("")}
      </table></div>
      <h3>Flagged students</h3>
      ${flagged.length ? `<div class="table-wrap"><table><tr><th>Student</th><th>CGPA</th><th>Standing</th></tr>
        ${flagged.map(s => `<tr><td>${esc(s.name)} (${esc(s.id)})</td><td>${s.cgpa.toFixed(2)}</td><td>${badge(s.standing)}</td></tr>`).join("")}
      </table></div>` : `<p class="empty">No students are flagged right now.</p>`}`;
  } catch (err) { toast(err.message, true); }
}
