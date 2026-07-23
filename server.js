// Charge les variables d'environnement AVANT tout autre import,
// car routes/auth.js et middlewares/authCheck.js lisent process.env
// dès leur évaluation (à l'import).
import "dotenv/config";

import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import apiAuthRoutes from "./routes/apiAuth.js";
import userRoutes from "./routes/user.js";
import batcomputerRoutes from "./routes/batcomputer.js";
import "./config/db.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(express.static("public"));

app.use("/auth", authRoutes);
app.use("/api/auth", apiAuthRoutes);
app.use("/api/user", userRoutes);
app.use(batcomputerRoutes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
