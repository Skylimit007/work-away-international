const SUBMIT_URL = "/api/submit"; // server forwards to FormSubmit

async function sendToFormSubmit(subject, fields) {
  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ _subject: subject, _template: "table", _captcha: "false", ...fields })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || String(data.success) !== "true") throw new Error(data.message || "Submission failed");
  return data;
}

const categories = ["All", "Agriculture", "Hospitality", "Food Service", "Landscaping"];
const filtersEl = document.getElementById("filters");
const listEl = document.getElementById("job-list");

function renderFilters(active) {
  filtersEl.innerHTML = categories
    .map((c) => `<button class="chip ${c === active ? "active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
  filtersEl.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => loadJobs(b.dataset.cat)));
}

async function loadJobs(category = "All") {
  renderFilters(category);
  const res = await fetch(`/api/jobs?category=${encodeURIComponent(category)}`);
  const jobs = await res.json();
  listEl.innerHTML = jobs.length
    ? jobs.map((j) => `
      <article class="card job">
        <div class="tags"><span class="tag visa">${j.visa}</span><span class="tag">${j.category}</span></div>
        <h3>${j.title}</h3>
        <div class="meta"><b>Location:</b> ${j.location}</div>
        <div class="meta"><b>Pay:</b> ${j.pay} · <b>Duration:</b> ${j.duration}</div>
        <div class="meta">${j.requirements}</div>
        <a href="#contact" class="btn btn-ghost btn-sm" style="align-self:flex-start;margin-top:8px">Ask about this role</a>
      </article>`).join("")
    : "<p>No roles in this category right now.</p>";
}

document.getElementById("elig-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const box = document.getElementById("elig-result");
  let msg, cls;
  if (d.age === "No") { msg = "You must be at least 18 to take part in these programs."; cls = "warn"; }
  else if (d.passport === "No") { msg = "Your first step is to get a valid passport. Once you have one, come back and browse our open roles."; cls = "warn"; }
  else if (d.country === "No") { msg = "Unfortunately H-2A/H-2B visas are only available to nationals of eligible countries. Check the latest list on travel.state.gov."; cls = "warn"; }
  else if (d.country === "Not sure") { msg = "Please confirm your country on the official eligible-countries list published by the U.S. government, then contact us."; cls = "warn"; }
  else { msg = "You look like a good fit to get started. Browse our open roles and send us a message about the one that interests you."; cls = "ok"; }
  box.className = `card result ${cls}`;
  box.innerHTML = `<h3>Your result</h3><p>${msg}</p><p class="muted" id="elig-status">Saving your answers…</p>`;
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  sendToFormSubmit("New eligibility check - Workaway International", {
    "18 or older": d.age, "Valid passport": d.passport, "Eligible country": d.country, Result: msg
  })
    .then(() => (document.getElementById("elig-status").textContent = "Your answers have been sent to our team."))
    .catch(() => (document.getElementById("elig-status").textContent = "We couldn't send your answers, but your result above is still valid."))
    .finally(() => (btn.disabled = false));
});

document.getElementById("contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById("contact-status");
  const btn = form.querySelector("button");
  const d = Object.fromEntries(new FormData(form));
  btn.disabled = true;
  btn.textContent = "Sending…";
  status.textContent = "";
  try {
    await sendToFormSubmit("New contact message - Workaway International", { Name: d.name, email: d.email, Message: d.message, _replyto: d.email });
    status.textContent = "Thanks! Your message has been sent. Our team will reply by email.";
    status.style.color = "#1f7a3f";
    form.reset();
  } catch (err) {
    status.textContent = /activ/i.test(err.message)
      ? "Our contact form is being activated. Please try again soon."
      : "Sorry, your message could not be sent. Please try again shortly.";
    status.style.color = "var(--accent)";
  } finally {
    btn.disabled = false;
    btn.textContent = "Send message";
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
loadJobs();
