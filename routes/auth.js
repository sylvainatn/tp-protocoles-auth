import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../db.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!password || password.length < 8) {
    return res
      .status(400)
      .send("Erreur : le mot de passe doit faire au minimum 8 caractères.");
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const insert = db.prepare(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
    );
    insert.run(username.trim(), hash);
    return res.status(201).send("Utilisateur créé avec succès !");
  } catch (err) {
    if (err.code && err.code.startsWith("SQLITE_CONSTRAINT")) {
      return res.status(409).send("Erreur : ce nom d'utilisateur existe déjà.");
    }
    return res.status(400).send("Erreur lors de la création de l'utilisateur.");
  }
});

export default router;
