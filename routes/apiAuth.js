import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { isAuthenticated } from "../middlewares/authCheck.js";
import { accessCookieOptions, signAccessToken } from "../config/tokens.js";

const apiAuthRoutes = Router();

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

apiAuthRoutes.post("/refresh", (req, res) => {
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

  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM refresh_tokens WHERE id = ?").run(row.id);
    return res.status(401).json({ error: "Refresh token expiré." });
  }

  const accessToken = signAccessToken({
    id: row.user_id,
    username: row.username,
  });
  res.cookie("accessToken", accessToken, accessCookieOptions);
  return res.status(200).json({ message: "Token rafraîchi." });
});

apiAuthRoutes.post("/change-password", isAuthenticated, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Les champs oldPassword et newPassword sont requis." });
  }

  const user = db
    .prepare("SELECT id, password_hash FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res
      .status(401)
      .json({ error: "L'ancien mot de passe est incorrect." });
  }

  if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      error:
        "Mot de passe trop faible : au moins 12 caractères, avec 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial.",
    });
  }

  if (bcrypt.compareSync(newPassword, user.password_hash)) {
    return res.status(400).json({
      error: "Le nouveau mot de passe doit être différent de l'ancien.",
    });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    newHash,
    user.id,
  );

  db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").run(user.id);

  return res.status(200).json({ message: "Mot de passe modifié avec succès." });
});

export default apiAuthRoutes;
