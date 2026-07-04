const express = require("express");
const authRoutes = require("./routes/auth");
const batcaveRoutes = require("./routes/batcave");
const batComputerRoutes = require("./routes/batcomputer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static("public"));

// Routes
app.use(authRoutes); // POST /register
app.use(batcaveRoutes); // GET /batcave
app.use(batComputerRoutes); // GET /bat-computer, /api/secrets, /api/me, POST /api/reports

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
