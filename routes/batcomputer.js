import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { isAuthenticated } from "../middlewares/authCheck.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// La page reste protégée (accessToken requis pour l'ouvrir). Les données
// utilisateur sont ensuite chargées côté client par dashboard.js via l'API.
router.get("/bat-computer", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "bat-computer.html"));
});

export default router;
