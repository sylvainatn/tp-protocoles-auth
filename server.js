import express from "express";
import authRoutes from "./routes/auth.js";
import batcaveRoutes from "./routes/batcave.js";
import batComputerRoutes from "./routes/batcomputer.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

// Routes
app.use(authRoutes); // POST /register
app.use(batcaveRoutes); // GET /batcave
app.use(batComputerRoutes); // GET /bat-computer, /api/secrets, /api/me, POST /api/reports

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
