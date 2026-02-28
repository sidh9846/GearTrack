const express = require("express");
const { db } = require("../db/db");
const router = express.Router();

router.get("/login", (req, res) => {
  const role = req.query.role === "admin" ? "admin" : "user";
  const users = db
    .prepare("SELECT id, username, display_name FROM users WHERE role = ? ORDER BY display_name")
    .all(role);

  res.render("login", { role, users, error: null });
});

router.post("/login", (req, res) => {
  const { userId, role } = req.body;

  const user = db
    .prepare("SELECT id, username, display_name, role FROM users WHERE id = ?")
    .get(userId);

  if (!user || user.role !== role) {
    const users = db
      .prepare("SELECT id, username, display_name FROM users WHERE role = ? ORDER BY display_name")
      .all(role);
    return res.render("login", { role, users, error: "Invalid selection. Try again." });
  }

  // Simple session login (security can be improved later)
  req.session.user = user;

  if (user.role === "admin") return res.redirect("/admin");
  return res.redirect("/user");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;