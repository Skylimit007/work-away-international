const jobs = require("../lib/jobs");
module.exports = (req, res) => {
  const { category } = req.query || {};
  res.status(200).json(category && category !== "All" ? jobs.filter((j) => j.category === category) : jobs);
};
