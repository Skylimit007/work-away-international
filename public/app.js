
"use strict";

// Your existing server-side endpoint forwards requests to FormSubmit.
const SUBMIT_URL =
  "https://formsubmit.co/ajax/info@workawayinternational.org";

async function sendToFormSubmit(subject, fields) {
  let res;

  try {
    res = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        ...fields,
        _subject: subject,
        _template: "table",
        _captcha: "false"
      })
    });
  } catch (error) {
    console.error("Form submission network error:", error);
    throw new Error(
      "Could not connect to the submission server. Check your internet connection and try again."
    );
  }

  // Read the response as text first, so HTML errors and empty
  // responses do not cause an unhandled JSON parsing error.
  const raw = await res.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    console.error("Invalid response from /api/submit:", raw);
    throw new Error(
      `The submission server returned an invalid response (HTTP ${res.status}).`
    );
  }

  if (!res.ok || String(data.success).toLowerCase() !== "true") {
    console.error("Form submission rejected:", {
      status: res.status,
      response: data
    });

    throw new Error(
      data.message ||
      data.error ||
      `Submission failed with HTTP ${res.status}.`
    );
  }

  return data;
}


// --------------------------------------------------
// JOB CATEGORIES AND JOB LIST
// --------------------------------------------------

const categories = [
  "All",
  "Agriculture",
  "Hospitality",
  "Food Service",
  "Landscaping"
];

const filtersEl = document.getElementById("filters");
const listEl = document.getElementById("job-list");

function renderFilters(active) {
  if (!filtersEl) return;

  filtersEl.innerHTML = categories
    .map(
      (category) => `
        <button
          class="chip ${category === active ? "active" : ""}"
          data-cat="${category}"
          type="button"
        >${category}</button>
      `
    )
    .join("");

  filtersEl.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      loadJobs(button.dataset.cat);
    });
  });
}

async function loadJobs(category = "All") {
  renderFilters(category);

  if (!listEl) return;

  try {
    const res = await fetch(
      `/api/jobs?category=${encodeURIComponent(category)}`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      throw new Error(`Jobs request failed with HTTP ${res.status}`);
    }

    const jobs = await res.json();

    if (!Array.isArray(jobs)) {
      throw new Error("The jobs API returned an unexpected response.");
    }

    listEl.innerHTML = jobs.length
      ? jobs
          .map(
            (job) => `
              <article class="card job">
                <div class="tags">
                  <span class="tag visa">${job.visa ?? ""}</span>
                  <span class="tag">${job.category ?? ""}</span>
                </div>

                <h3>${job.title ?? ""}</h3>

                <div class="meta">
                  <b>Location:</b> ${job.location ?? ""}
                </div>

                <div class="meta">
                  <b>Pay:</b> ${job.pay ?? ""}
                  · <b>Duration:</b> ${job.duration ?? ""}
                </div>

                <div class="meta">${job.requirements ?? ""}</div>

                <a
                  href="#contact"
                  class="btn btn-ghost btn-sm"
                  style="align-self:flex-start;margin-top:8px"
                >Ask about this role</a>
              </article>
            `
          )
          .join("")
      : "<p>No roles in this category right now.</p>";
  } catch (error) {
    console.error("Could not load jobs:", error);
    listEl.innerHTML =
      "<p>We couldn't load the jobs right now. Please refresh the page and try again.</p>";
  }
}


// --------------------------------------------------
// ELIGIBILITY CHECKER
// --------------------------------------------------

const eligibilityForm = document.getElementById("elig-form");

if (eligibilityForm) {
  eligibilityForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    const box = document.getElementById("elig-result");

    if (!box) return;

    let msg;
    let cls;

    if (d.age === "No") {
      msg =
        "You must be at least 18 to take part in these programs.";
      cls = "warn";
    } else if (d.passport === "No") {
      msg =
        "Your first step is to get a valid passport. Once you have one, come back and browse our open roles.";
      cls = "warn";
    } else if (d.country === "No") {
      msg =
        "Unfortunately H-2A/H-2B visas are only available to nationals of eligible countries. Check the latest list on travel.state.gov.";
      cls = "warn";
    } else if (d.country === "Not sure") {
      msg =
        "Please confirm your country on the official eligible-countries list published by the U.S. government, then contact us.";
      cls = "warn";
    } else {
      msg =
        "You look like a good fit to get started. Browse our open roles and send us a message about the one that interests you.";
      cls = "ok";
    }

    box.className = `card result ${cls}`;
    box.innerHTML = `
      <h3>Your result</h3>
      <p>${msg}</p>
      <p class="muted" id="elig-status" role="status" aria-live="polite">
        Saving your answers…
      </p>
    `;

    const status = document.getElementById("elig-status");
    const btn = form.querySelector('button[type="submit"], button:not([type])');

    if (btn) btn.disabled = true;

    try {
      await sendToFormSubmit(
        "New eligibility check - Workaway International",
        {
          "18 or older": d.age,
          "Valid passport": d.passport,
          "Eligible country": d.country,
          Result: msg
        }
      );

      if (status) {
        status.textContent =
          "Your answers have been sent to our team.";
      }
    } catch (error) {
      console.error("Eligibility submission failed:", error);

      if (status) {
        status.textContent =
          "We couldn't send your answers. Your result above is still valid. Please try again later.";
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}


// --------------------------------------------------
// CONTACT FORM
// --------------------------------------------------

const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const status = document.getElementById("contact-status");
    const btn = form.querySelector('button[type="submit"], button:not([type])');

    const d = Object.fromEntries(new FormData(form));

    // Validate required fields before contacting the server.
    if (
      !String(d.name || "").trim() ||
      !String(d.email || "").trim() ||
      !String(d.message || "").trim()
    ) {
      if (status) {
        status.textContent =
          "Please enter your name, a valid email address, and your message.";
        status.style.color = "var(--accent)";
      }
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email).trim())) {
      if (status) {
        status.textContent =
          "Please enter a valid email address.";
        status.style.color = "var(--accent)";
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending…";
    }

    if (status) {
      status.textContent = "Sending your message…";
      status.style.color = "";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
    }

    try {
      await sendToFormSubmit(
        "New contact message - Workaway International",
        {
          Name: String(d.name).trim(),
          email: String(d.email).trim(),
          Message: String(d.message).trim(),
          _replyto: String(d.email).trim()
        }
      );

      if (status) {
        status.textContent =
          "Thanks! Your message has been sent. Our team will reply by email.";
        status.style.color = "#1f7a3f";
      }

      form.reset();
    } catch (error) {
      console.error("Contact form submission failed:", error);

      if (status) {
        // Show the server's actual error rather than hiding
        // every failure behind the same generic message.
        status.textContent =
          error.message ||
          "Sorry, your message could not be sent. Please try again shortly.";

        status.style.color = "var(--accent)";
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Send message";
      }
    }
  });
}


// --------------------------------------------------
// FOOTER YEAR
// --------------------------------------------------

const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


// --------------------------------------------------
// INITIALIZE JOB LIST
// --------------------------------------------------

loadJobs();
