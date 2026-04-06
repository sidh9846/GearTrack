const express = require("express");
const { db } = require("../db/db");
const { normalizeText } = require("../utils/validation");
const { verifyPassword } = require("../utils/security");
const router = express.Router();

function renderLogin(res, role, error = null, formData = {}) {
  res.render("login", {
    role,
    error,
    formData: {
      username: formData.username || "",
    },
  });
}

router.get("/login", (req, res) => {
  const role = req.query.role === "admin" ? "admin" : "user";
  renderLogin(res, role);
});

router.post("/login", (req, res) => {
  const username = normalizeText(req.body.username).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const role = req.body.role === "admin" ? "admin" : "user";

  if (!username || !password) {
    return renderLogin(res, role, "Enter both username and password.", { username });
  }

  const user = db
    .prepare("SELECT id, username, display_name, role, password_hash FROM users WHERE username = ?")
    .get(username);

  if (!user || user.role !== role || !verifyPassword(password, user.password_hash)) {
    return renderLogin(res, role, "Invalid username, password, or role.", { username });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
  };

  if (user.role === "admin") return res.redirect("/admin");
  return res.redirect("/user");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
