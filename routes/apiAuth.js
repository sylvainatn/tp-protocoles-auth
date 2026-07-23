import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import { isAuthenticated } from "../middlewares/authCheck.js";
import { accessCookieOptions, signAccessToken } from "../config/tokens.js";

const apiAuthRoutes = Router();

// Politique ANSSI : au moins 12 caractères, 1 majuscule, 1 minuscule,
// 1 chiffre et 1 caractère spécial. Validation faite EXCLUSIVEMENT côté serveur.
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

// ÉTAPE 3 — Rafraîchissement : échange un refreshToken valide (présent en base
// et non expiré) contre un nouvel accessToken de 15 s.
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

  // Le refreshToken doit exister en base.
  if (!row) {
    return res.status(401).json({ error: "Refresh token invalide." });
  }

  // ... et ne pas être expiré (vérification serveur, 7 jours).
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM refresh_tokens WHERE id = ?").run(row.id);
    return res.status(401).json({ error: "Refresh token expiré." });
  }

  // Réémission d'un accessToken pour 15 secondes supplémentaires.
  const accessToken = signAccessToken({
    id: row.user_id,
    username: row.username,
  });
  res.cookie("accessToken", accessToken, accessCookieOptions);
  return res.status(200).json({ message: "Token rafraîchi." });
});

// Route accessible uniquement à un utilisateur authentifié (accessToken valide).
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

  // Validation 1 — Authenticité : l'ancien mot de passe doit correspondre au hash stocké.
  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res
      .status(401)
      .json({ error: "L'ancien mot de passe est incorrect." });
  }

  // Validation 2 — Robustesse (ANSSI) : le nouveau mot de passe doit être fort.
  if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      error:
        "Mot de passe trop faible : au moins 12 caractères, avec 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial.",
    });
  }

  // Interdire de reprendre exactement le même mot de passe.
  if (bcrypt.compareSync(newPassword, user.password_hash)) {
    return res.status(400).json({
      error: "Le nouveau mot de passe doit être différent de l'ancien.",
    });
  }

  // Hachage du nouveau mot de passe avant enregistrement.
  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    newHash,
    user.id,
  );

  // Sécurité : on révoque les refreshToken existants de l'utilisateur,
  // afin d'invalider les anciennes sessions après changement de mot de passe.
  db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").run(user.id);

  return res
    .status(200)
    .json({ message: "Mot de passe modifié avec succès." });
});

export default apiAuthRoutes;
