import { Router } from "express";
import { isAuthenticated } from "../middlewares/authCheck.js";

const userRoutes = Router();

// Donnée utilisateur protégée : renvoie le profil déduit de l'accessToken.
// Sert de cible aux appels du tableau de bord (retry pattern côté front).
userRoutes.get("/me", isAuthenticated, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

export default userRoutes;
