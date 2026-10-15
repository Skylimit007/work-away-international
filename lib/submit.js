
"use strict";

// Forwards a submission to FormSubmit from the server.
module.exports = async function forwardToFormSubmit(fields, host) {
  const email = (
    process.env.FORMSUBMIT_EMAIL || "roynyarega@gmail.com"
  ).trim();

  if (!email || !email.includes("@")) {
    return {
      status: 500,
      data: {
        success: "false",
        message: "FORMSUBMIT_EMAIL is missing or invalid."
      }
    };
  }

  if (
    !fields ||
    typeof fields !== "object" ||
    Array.isArray(fields) ||
    !fields._subject ||
    typeof fields._subject !== "string"
  ) {
    return {
      status: 400,
      data: {
        success: "false",
        message: "Missing or invalid subject."
      }
    };
  }

  const endpoint =
    `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(fields),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    // Read the body once as text. FormSubmit or an upstream
    // service may return HTML or plain text instead of JSON.
    const raw = await response.text();

    let data;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      console.error("FormSubmit returned a non-JSON response:", {
        status: response.status,
        contentType: response.headers.get("content-type"),
        body: raw.slice(0, 1000)
      });

      return {
        status: 502,
        data: {
          success: "false",
          message:
            `Invalid response from FormSubmit (HTTP ${response.status}).`,
          upstreamStatus: response.status,
          upstreamResponse: raw.slice(0, 500)
        }
      };
    }

    const successful =
      response.ok &&
      String(data.success).toLowerCase() === "true";

    if (!successful) {
      console.error("FormSubmit rejected the submission:", {
        status: response.status,
        response: data
      });

      return {
        status: 502,
        data: {
          success: "false",
          message:
            data.message ||
            data.error ||
            `FormSubmit rejected the request (HTTP ${response.status}).`,
          upstreamStatus: response.status,
          upstreamResponse: data
        }
      };
    }

    return {
      status: 200,
      data: {
        ...data,
        success: "true"
      }
    };
  } catch (error) {
    const timedOut = error.name === "AbortError";

    console.error("FormSubmit forwarding error:", {
      name: error.name,
      message: error.message
    });

    return {
      status: 502,
      data: {
        success: "false",
        message: timedOut
          ? "FormSubmit request timed out after 15 seconds."
          : "Could not connect to FormSubmit. Check the server logs and network connectivity."
      }
    };
  }
};
