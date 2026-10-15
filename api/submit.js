const forward = require("../lib/submit");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ success: "false", message: "Method not allowed" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const { status, data } = await forward(body, req.headers.host);
  res.status(status).json(data);
};
