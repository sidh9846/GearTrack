const express = require("express");
const { db } = require("../db/db");
const router = express.Router();

const CATEGORIES = ["Controller", "Mixer", "Speaker", "Microphone", "Lighting", "Stand", "Accessory"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Damaged"];

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  if (req.session.user.role !== "admin") return res.redirect("/user");
  next();
}

router.get("/admin", requireAdmin, (req, res) => {
  res.render("admin_dashboard");
});

// Users
router.get("/admin/users", requireAdmin, (req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY role DESC, display_name").all();
  res.render("admin_users", { users, error: null });
});

router.post("/admin/users", requireAdmin, (req, res) => {
  const { username, display_name, role } = req.body;
  if (!username || !display_name || !["admin", "user"].includes(role)) {
    const users = db.prepare("SELECT * FROM users ORDER BY role DESC, display_name").all();
    return res.render("admin_users", { users, error: "Invalid input." });
  }

  try {
    db.prepare("INSERT INTO users (username, display_name, role) VALUES (?, ?, ?)")
      .run(username.trim(), display_name.trim(), role);
    return res.redirect("/admin/users");
  } catch (e) {
    const users = db.prepare("SELECT * FROM users ORDER BY role DESC, display_name").all();
    return res.render("admin_users", { users, error: "Username already exists." });
  }
});

// Equipment list
router.get("/admin/equipment", requireAdmin, (req, res) => {
  const items = db.prepare("SELECT * FROM equipment ORDER BY name").all();
  res.render("admin_equipment", { items });
});

// Add equipment
router.get("/admin/equipment/new", requireAdmin, (req, res) => {
  res.render("equipment_form", {
    mode: "new",
    item: null,
    CATEGORIES,
    CONDITIONS,
    error: null,
  });
});

router.post("/admin/equipment/new", requireAdmin, (req, res) => {
  const { name, category, serial, condition, notes } = req.body;

  if (!name || !CATEGORIES.includes(category) || !serial || !CONDITIONS.includes(condition)) {
    return res.render("equipment_form", {
      mode: "new",
      item: { name, category, serial, condition, notes },
      CATEGORIES,
      CONDITIONS,
      error: "Please fill required fields correctly.",
    });
  }

  db.prepare(
    `INSERT INTO equipment (name, category, serial, notes, status, condition)
     VALUES (?, ?, ?, ?, 'available', ?)`
  ).run(name.trim(), category, serial.trim(), notes || null, condition);

  res.redirect("/admin/equipment");
});

// Edit equipment
router.get("/admin/equipment/:id/edit", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
  if (!item) return res.status(404).send("Item not found");

  res.render("equipment_form", {
    mode: "edit",
    item,
    CATEGORIES,
    CONDITIONS,
    error: null,
  });
});

router.post("/admin/equipment/:id/edit", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
  if (!existing) return res.status(404).send("Item not found");

  const { name, category, serial, condition, notes } = req.body;

  if (!name || !CATEGORIES.includes(category) || !serial || !CONDITIONS.includes(condition)) {
    return res.render("equipment_form", {
      mode: "edit",
      item: { ...existing, name, category, serial, condition, notes },
      CATEGORIES,
      CONDITIONS,
      error: "Please fill required fields correctly.",
    });
  }

  db.prepare(
    `
    UPDATE equipment
    SET name = ?, category = ?, serial = ?, notes = ?, condition = ?
    WHERE id = ?
    `
  ).run(name.trim(), category, serial.trim(), notes || null, condition, id);

  res.redirect("/admin/equipment");
});

// Delete equipment (only if not checked out)
router.post("/admin/equipment/:id/delete", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
  if (!item) return res.status(404).send("Item not found");
  if (item.status === "checked_out") return res.status(400).send("Cannot delete checked-out equipment.");

  db.prepare("DELETE FROM equipment WHERE id = ?").run(id);
  res.redirect("/admin/equipment");
});

module.exports = router;