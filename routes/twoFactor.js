import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { authenticator } from "@otplib/preset-v11";
import QRCode from "qrcode";
import db from "../config/db.js";
import {
  REFRESH_TOKEN_MAX_AGE,
  accessCookieOptions,
  refreshCookieOptions,
  signAccessToken,
} from "../config/tokens.js";

const twoFactorRoutes = Router();

const APP_NAME = "Batcave";

function authenticateWithPassword(username, password) {
  const user = db
    .prepare(
      "SELECT id, username, password_hash, two_factor_secret, two_factor_enabled FROM users WHERE username = ?",
    )
    .get((username || "").trim());

  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return null;
  }
  return user;
}

function issueSession(res, user) {
  const accessToken = signAccessToken(user);

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE).toISOString();
  db.prepare(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
  ).run(user.id, refreshToken, expiresAt);

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
}

twoFactorRoutes.post("/2fa/setup", async (req, res) => {
  const { username, password } = req.body;

  const user = authenticateWithPassword(username, password);
  if (!user) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  const secret = authenticator.generateSecret();

  const otpauthUri = authenticator.keyuri(user.username, APP_NAME, secret);

  db.prepare("UPDATE users SET two_factor_secret = ? WHERE id = ?").run(
    secret,
    user.id,
  );

  const qrCode = await QRCode.toDataURL(otpauthUri);

  return res.json({ qrCode, secret });
});

twoFactorRoutes.post("/2fa/confirm", (req, res) => {
  const { username, password, token } = req.body;

  const user = authenticateWithPassword(username, password);
  if (!user) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  if (!user.two_factor_secret) {
    return res
      .status(400)
      .json({ error: "Aucune initialisation 2FA en attente." });
  }

  const isValid = authenticator.verify({
    token: String(token || ""),
    secret: user.two_factor_secret,
  });

  if (!isValid) {
    return res.status(401).json({ error: "Code 2FA invalide ou expiré." });
  }

  db.prepare("UPDATE users SET two_factor_enabled = 1 WHERE id = ?").run(
    user.id,
  );

  return res.json({ message: "2FA activée avec succès." });
});

twoFactorRoutes.post("/verify-2fa", (req, res) => {
  const { username, token } = req.body;

  const user = db
    .prepare(
      "SELECT id, username, two_factor_secret, two_factor_enabled FROM users WHERE username = ?",
    )
    .get((username || "").trim());

  if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
    return res.status(401).json({ error: "Authentification impossible." });
  }

  const isValid = authenticator.verify({
    token: String(token || ""),
    secret: user.two_factor_secret,
  });

  if (!isValid) {
    return res.status(401).json({ error: "Code 2FA invalide." });
  }

  issueSession(res, user);
  return res.json({ message: "Connexion réussie.", redirect: "/bat-computer" });
});

export default twoFactorRoutes;
