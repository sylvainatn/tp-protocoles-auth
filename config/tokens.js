import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

export const ACCESS_TOKEN_TTL = "15s";
const ACCESS_COOKIE_MAX_AGE = 15 * 1000; // 15 secondes
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours

const secureCookies = process.env.NODE_ENV === "production";

export const accessCookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: "strict",
  maxAge: ACCESS_COOKIE_MAX_AGE,
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: "strict",
  maxAge: REFRESH_TOKEN_MAX_AGE,
  path: "/",
};

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}
