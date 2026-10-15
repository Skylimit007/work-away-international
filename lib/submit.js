// Forwards a submission to FormSubmit server-side so it works from any host.
module.exports = async function forwardToFormSubmit(fields, host) {
  const email = process.env.FORMSUBMIT_EMAIL || "roynyarega@gmail.com";
  const siteUrl = process.env.SITE_URL || (host && !/^(localhost|127\.)/.test(host) ? `https://${host}` : "https://workawayinternational.com");
  if (!fields || !fields._subject) return { status: 400, data: { success: "false", message: "Missing subject." } };
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${email}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Referer: siteUrl + "/", Origin: siteUrl },
      body: JSON.stringify(fields)
    });
    const data = await r.json().catch(() => ({ success: "false", message: "Invalid response from FormSubmit." }));
    return { status: String(data.success) === "true" ? 200 : 502, data };
  } catch (err) {
    return { status: 502, data: { success: "false", message: "Could not reach FormSubmit." } };
  }
};
