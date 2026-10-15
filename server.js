const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const jobs = [
  { id: 1, title: "Seasonal Orchard Worker", category: "Agriculture", visa: "H-2A", location: "Wenatchee, Washington", pay: "$19.82 / hour", duration: "6 months", requirements: "Comfortable with outdoor physical work; prior farm experience preferred." },
  { id: 2, title: "Hotel Room Attendant", category: "Hospitality", visa: "H-2B", location: "Park City, Utah", pay: "$18.50 / hour", duration: "5 months", requirements: "Attention to detail and ability to work as part of a team." },
  { id: 3, title: "Line Cook", category: "Food Service", visa: "H-2B", location: "Myrtle Beach, South Carolina", pay: "$17.00 / hour", duration: "7 months", requirements: "One year of kitchen experience and basic food-safety knowledge." },
  { id: 4, title: "Landscape Laborer", category: "Landscaping", visa: "H-2B", location: "Austin, Texas", pay: "$16.75 / hour", duration: "9 months", requirements: "Able to lift 50 lbs and work in warm conditions." },
  { id: 5, title: "Greenhouse Technician", category: "Agriculture", visa: "H-2A", location: "Salinas, California", pay: "$19.75 / hour", duration: "8 months", requirements: "Experience with irrigation or plant care is an advantage." },
  { id: 6, title: "Resort Kitchen Steward", category: "Hospitality", visa: "H-2B", location: "Bar Harbor, Maine", pay: "$17.25 / hour", duration: "5 months", requirements: "Reliable, punctual and comfortable with fast-paced shifts." }
];

app.get("/api/jobs", (req, res) => {
  const { category } = req.query;
  res.json(category && category !== "All" ? jobs.filter((j) => j.category === category) : jobs);
});

app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ ok: false, error: "Please fill in all fields." });
  console.log(`[contact] message received from ${name}`);
  res.json({ ok: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, "0.0.0.0", () => console.log(`Workaway International running on http://localhost:${PORT}`));
