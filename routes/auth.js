const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

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
    res.status(201).send("Utilisateur créé avec succès !");
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT") {
      return res.status(409).send("Erreur : ce nom d'utilisateur existe déjà.");
    }
    res.status(400).send("Erreur lors de la création de l'utilisateur.");
  }
});

module.exports = router;
