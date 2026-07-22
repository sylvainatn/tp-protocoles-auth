import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

// Un appel API attend une réponse JSON (401), pas une redirection HTML.
function wantsJson(req) {
  return req.originalUrl.startsWith("/api");
}

export function isAuthenticated(req, res, next) {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    if (wantsJson(req)) {
      return res.status(401).json({ error: "Non authentifié." });
    }
    return res.redirect("/auth/login");
  }

  try {
    // Vérifie la signature ET l'expiration (15 s) du JWT.
    const payload = jwt.verify(accessToken, JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch (err) {
    // Token invalide ou expiré.
    if (wantsJson(req)) {
      return res
        .status(401)
        .json({ error: "Token expiré ou invalide.", code: "TOKEN_EXPIRED" });
    }
    return res.redirect("/auth/login");
  }
}
