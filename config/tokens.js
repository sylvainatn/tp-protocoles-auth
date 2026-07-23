import jwt from "jsonwebtoken";

// Clé secrète de signature des accessToken (chargée depuis .env).
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

// Durée de vie très courte de l'accessToken pour tester le renouvellement en direct.
export const ACCESS_TOKEN_TTL = "15s";
const ACCESS_COOKIE_MAX_AGE = 15 * 1000; // 15 secondes
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours

// "secure" (HTTPS uniquement) en production ; désactivé en local (http://localhost)
// sinon le navigateur refuserait de stocker les cookies.
const secureCookies = process.env.NODE_ENV === "production";

// Cookie de l'accessToken : httpOnly, sameSite strict, expire en 15 s.
export const accessCookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: "strict",
  maxAge: ACCESS_COOKIE_MAX_AGE,
};

// Cookie du refreshToken : httpOnly, sameSite strict, 7 jours.
// path "/" pour qu'il soit envoyé aussi bien à /api/auth/refresh qu'à la
// route de déconnexion (qui doit pouvoir le révoquer en base).
export const refreshCookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: "strict",
  maxAge: REFRESH_TOKEN_MAX_AGE,
  path: "/",
};

// Signe un accessToken JWT pour un utilisateur donné.
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}
