import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const authRoutes = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

authRoutes.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "login.html"));
});

authRoutes.post("/login", (req, res, next) => {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get((username || "").trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).send("Identifiants invalides.");
  }

  req.session.regenerate((err) => {
    if (err) return next(err);

    req.session.user = { id: user.id, username: user.username };

    req.session.save((err) => {
      if (err) return next(err);
      res.redirect("/bat-computer");
    });
  });
});

authRoutes.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "register.html"));
});

authRoutes.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!password || password.length < 8) {
    return res
      .status(400)
      .send("Erreur : le mot de passe doit faire au minimum 8 caractères.");
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
      (username || "").trim(),
      hash,
    );
    return res.redirect("/auth/login");
  } catch (err) {
    if (err.code && err.code.startsWith("SQLITE_CONSTRAINT")) {
      return res.status(409).send("Erreur : ce nom d'utilisateur existe déjà.");
    }
    return res.status(400).send("Erreur lors de la création de l'utilisateur.");
  }
});

authRoutes.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("bat_identity");
    res.redirect("/auth/login");
  });
});

export default authRoutes;
