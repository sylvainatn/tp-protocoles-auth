import { Router } from "express";
import basicAuth from "../middlewares/basicAuth.js";

const router = Router();

router.get("/batcave", basicAuth, (req, res) => {
  res.send(`Bienvenue dans la Batcave, ${req.user.username}.`);
});

export default router;
