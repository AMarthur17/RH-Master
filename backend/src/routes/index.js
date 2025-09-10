const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => res.json({ ok: true, message: "pong" }));
router.use("/usuarios", require("./usuarios"));

module.exports = router;
