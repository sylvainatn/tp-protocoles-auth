import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { isAuthenticated } from "../middlewares/authCheck.js";
import {
  REFRESH_TOKEN_MAX_AGE,
  accessCookieOptions,
  refreshCookieOptions,
  signAccessToken,
} from "../config/tokens.js";

const authRoutes = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

authRoutes.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "login.html"));
});

authRoutes.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get((username || "").trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).send("Identifiants invalides.");
  }

  // 1) accessToken : JWT signé avec notre clé secrète, durée de vie 15 s.
  const accessToken = signAccessToken(user);

  // 2) refreshToken : chaîne aléatoire cryptographique (jeton opaque),
  //    valable 7 jours et stockée en base SQLite.
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE).toISOString();

  db.prepare(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
  ).run(user.id, refreshToken, expiresAt);

  // 3) Envoi des deux jetons dans deux cookies sécurisés distincts.
  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  res.redirect("/bat-computer");
});

// Page de changement de mot de passe : réservée aux utilisateurs authentifiés.
authRoutes.get("/change-password", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "change-password.html"));
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

  // On révoque le refreshToken côté serveur (suppression en base).
  if (refreshToken) {
    db.prepare("DELETE FROM refresh_tokens WHERE token = ?").run(refreshToken);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/" });
  res.redirect("/auth/login");
});

export default authRoutes;
