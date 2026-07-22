import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { isAuthenticated } from "../middlewares/authCheck.js";

const authRoutes = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

// Durée de vie très courte pour tester le renouvellement en direct.
const ACCESS_TOKEN_TTL = "15s";
const ACCESS_COOKIE_MAX_AGE = 15 * 1000; // 15 secondes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours

// Options communes aux deux cookies : inaccessibles au JS (httpOnly),
// non envoyés en cross-site (sameSite strict), et "secure" (HTTPS) en prod.
// En local (http://localhost) on désactive "secure" sinon le navigateur
// refuserait de stocker le cookie.
const secureCookies = process.env.NODE_ENV === "production";

const accessCookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: "strict",
  maxAge: ACCESS_COOKIE_MAX_AGE,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: "strict",
  maxAge: REFRESH_TOKEN_MAX_AGE,
  // Le refreshToken ne sert qu'à obtenir un nouvel accessToken :
  // on le limite à la route de rafraîchissement.
  path: "/auth/refresh",
};

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
  const accessToken = jwt.sign(
    { sub: user.id, username: user.username },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

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

// Échange un refreshToken valide (stocké en base) contre un nouvel accessToken.
authRoutes.post("/refresh", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token manquant." });
  }

  const row = db
    .prepare(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.username
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = ?`,
    )
    .get(refreshToken);

  if (!row) {
    return res.status(401).json({ error: "Refresh token invalide." });
  }

  // Vérification de l'expiration côté serveur (7 jours).
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM refresh_tokens WHERE id = ?").run(row.id);
    return res.status(401).json({ error: "Refresh token expiré." });
  }

  const accessToken = jwt.sign(
    { sub: row.user_id, username: row.username },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  res.cookie("accessToken", accessToken, accessCookieOptions);
  return res.status(200).json({ message: "Token rafraîchi." });
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
  res.clearCookie("refreshToken", { path: "/auth/refresh" });
  res.redirect("/auth/login");
});

export default authRoutes;
