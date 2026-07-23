import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { isAuthenticated } from "../middlewares/authCheck.js";

const authRoutes = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

authRoutes.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "login.html"));
});

authRoutes.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare(
      "SELECT id, username, password_hash, two_factor_enabled FROM users WHERE username = ?",
    )
    .get((username || "").trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  if (!user.two_factor_enabled) {
    return res.status(403).json({
      error:
        "Vous devez activer la double authentification (2FA) avant de vous connecter.",
      requiresEnrollment: true,
    });
  }

  return res.json({ requires2FA: true, username: user.username });
});

authRoutes.get("/change-password", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "change-password.html"));
});

authRoutes.get("/setup-2fa", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "setup-2fa.html"));
});

authRoutes.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "register.html"));
});

authRoutes.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!password || password.length < 8) {
    return res
      .status(400)
      .send("Erreur : le mot de passe doit faire au minimum 8 caractères.");
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
      (username || "").trim(),
      hash,
    );
    return res.redirect("/auth/login");
  } catch (err) {
    if (err.code && err.code.startsWith("SQLITE_CONSTRAINT")) {
      return res.status(409).send("Erreur : ce nom d'utilisateur existe déjà.");
    }
    return res.status(400).send("Erreur lors de la création de l'utilisateur.");
  }
});

authRoutes.get("/logout", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    db.prepare("DELETE FROM refresh_tokens WHERE token = ?").run(refreshToken);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/" });
  res.redirect("/auth/login");
});

export default authRoutes;
