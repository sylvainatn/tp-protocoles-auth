import crypto from "crypto";
import db from "./db.js";
import {
  REFRESH_TOKEN_MAX_AGE,
  accessCookieOptions,
  refreshCookieOptions,
  signAccessToken,
} from "./tokens.js";

// Émet une session authentifiée : accessToken (JWT 15 min) + refreshToken
// (opaque, 7 j, stocké en base), déposés dans deux cookies sécurisés.
// Utilisé après la 2FA (TP4) et après un login OAuth réussi (TP5).
export function issueSession(res, user) {
  const accessToken = signAccessToken(user);

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE).toISOString();
  db.prepare(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
  ).run(user.id, refreshToken, expiresAt);

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
}
