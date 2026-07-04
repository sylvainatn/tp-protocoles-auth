const express = require("express");
const basicAuth = require("../middlewares/basicAuth");

const router = express.Router();

router.get("/batcave", basicAuth, (req, res) => {
  res.send(`Bienvenue dans la Batcave, ${req.user.username}.`);
});

module.exports = router;
