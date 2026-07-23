import crypto from "crypto";
import db from "./db.js";
import {
  REFRESH_TOKEN_MAX_AGE,
  accessCookieOptions,
  refreshCookieOptions,
  signAccessToken,
} from "./tokens.js";

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
