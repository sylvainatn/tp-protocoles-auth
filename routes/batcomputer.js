import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import basicAuth from "../middlewares/basicAuth.js";
import db from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

const gadgets = [
  {
    name: "Batarang",
    desc: "Arme de jet en forme de chauve-souris",
    icon: "fa-shuriken",
  },
  {
    name: "Grappin",
    desc: "Pistolet à grappin pour l'escalade",
    icon: "fa-hand-fist",
  },
  {
    name: "Bat-Signal",
    desc: "Projecteur d'appel de Gotham",
    icon: "fa-tower-broadcast",
  },
  {
    name: "Fumigène",
    desc: "Grenade fumigène pour disparaître",
    icon: "fa-smog",
  },
  {
    name: "Batmobile",
    desc: "Véhicule blindé tout-terrain",
    icon: "fa-car-side",
  },
  {
    name: "Détecteur",
    desc: "Analyseur de traces médico-légal",
    icon: "fa-magnifying-glass",
  },
];

router.get("/bat-computer", basicAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "private", "bat-computer.html"));
});

router.get("/bat-computer.js", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "private", "bat-computer.js"));
});

router.get("/api/secrets", basicAuth, (req, res) => {
  res.json(gadgets);
});

router.get("/api/me", basicAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

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

export default router;
