import { Router } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { isAuthenticated } from "../middlewares/authCheck.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

router.get("/bat-computer", isAuthenticated, (req, res) => {
  const file = path.join(__dirname, "..", "views", "bat-computer.html");
  const html = fs
    .readFileSync(file, "utf-8")
    .replace("{{username}}", req.session.user.username);
  res.send(html);
});

export default router;
