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
  box.innerHTML = `<h3>Your result</h3><p>${msg}</p>`;
});

document.getElementById("contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("contact-status");
  const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
  const data = await res.json();
  status.textContent = data.ok ? "Thanks! Our team will reply by email." : data.error;
  if (data.ok) e.target.reset();
});

document.getElementById("year").textContent = new Date().getFullYear();
loadJobs();
