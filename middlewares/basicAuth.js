import bcrypt from "bcrypt";
import db from "../db.js";

const WWW_AUTHENTICATE = 'Basic realm="Batcave", charset="UTF-8"';

async function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.set("WWW-Authenticate", WWW_AUTHENTICATE);
    return res.status(401).send("Authentification requise.");
  }

  const base64Credentials = authHeader.slice("Basic ".length).trim();
  let decoded;
  try {
    decoded = Buffer.from(base64Credentials, "base64").toString("utf-8");
  } catch {
    res.set("WWW-Authenticate", WWW_AUTHENTICATE);
    return res.status(401).send("En-tête Authorization invalide.");
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    res.set("WWW-Authenticate", WWW_AUTHENTICATE);
    return res.status(401).send("En-tête Authorization invalide.");
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  const user = db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get(username.trim());

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.set("WWW-Authenticate", WWW_AUTHENTICATE);
    return res.status(401).send("Identifiants invalides.");
  }

  req.user = { id: user.id, username: user.username };
  next();
}

export default basicAuth;
