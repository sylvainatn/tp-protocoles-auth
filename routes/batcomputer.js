const express = require("express");
const path = require("path");
const basicAuth = require("../middlewares/basicAuth");
const db = require("../db");

const router = express.Router();

// L'arsenal de Batman renvoyé par la route sécurisée /api/secrets
const gadgets = [
  { name: "Batarang", desc: "Arme de jet en forme de chauve-souris", icon: "fa-shuriken" },
  { name: "Grappin", desc: "Pistolet à grappin pour l'escalade", icon: "fa-hand-fist" },
  { name: "Bat-Signal", desc: "Projecteur d'appel de Gotham", icon: "fa-tower-broadcast" },
  { name: "Fumigène", desc: "Grenade fumigène pour disparaître", icon: "fa-smog" },
  { name: "Batmobile", desc: "Véhicule blindé tout-terrain", icon: "fa-car-side" },
  { name: "Détecteur", desc: "Analyseur de traces médico-légal", icon: "fa-magnifying-glass" },
];

// GET /bat-computer -> sert la coquille HTML privée (hors du dossier public).
// La page est inutile sans identifiants : elle redirige vers /login.html et
// toutes les données sensibles passent par les APIs protégées ci-dessous.
router.get("/bat-computer", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "private", "bat-computer.html"));
});

// GET /api/secrets -> renvoie l'arsenal au format JSON (Phase 3)
router.get("/api/secrets", basicAuth, (req, res) => {
  res.json(gadgets);
});

// GET /api/me -> infos de l'utilisateur authentifié (Phase 3.1)
router.get("/api/me", basicAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

// POST /api/reports -> enregistre une note de mission liée à l'utilisateur (Phase 3.1)
router.post("/api/reports", basicAuth, (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Le contenu du rapport est requis." });
  }

  const info = db
    .prepare("INSERT INTO reports (user_id, content) VALUES (?, ?)")
    .run(req.user.id, content.trim());

  res.status(201).json({
    id: info.lastInsertRowid,
    user_id: req.user.id,
    content: content.trim(),
  });
});

module.exports = router;
