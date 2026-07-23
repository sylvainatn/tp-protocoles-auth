import { Router } from "express";
import { isAuthenticated } from "../middlewares/authCheck.js";

const userRoutes = Router();

userRoutes.get("/me", isAuthenticated, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

export default userRoutes;
