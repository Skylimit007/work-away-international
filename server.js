// Local development server. On Vercel, /public is served statically and /api/* runs as serverless functions.
const express = require("express");
const path = require("path");
const jobsHandler = require("./api/jobs");
const submitHandler = require("./api/submit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/jobs", jobsHandler);
app.post("/api/submit", submitHandler);
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, "0.0.0.0", () => console.log(`Workaway International running on http://localhost:${PORT}`));
