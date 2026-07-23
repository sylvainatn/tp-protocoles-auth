import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { isAuthenticated } from "../middlewares/authCheck.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

router.get("/bat-computer", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "bat-computer.html"));
});

export default router;
