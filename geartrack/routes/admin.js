const express = require("express");
const { db } = require("../db/db");
const { hashPassword } = require("../utils/security");
const {
  CATEGORIES,
  CONDITIONS,
  validateUserInput,
  validateEquipmentInput,
} = require("../utils/validation");
const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  if (req.session.user.role !== "admin") return res.redirect("/user");
  next();
}

function loadUsersPage(res, overrides = {}) {
  const users = db.prepare("SELECT * FROM users ORDER BY role DESC, display_name").all();
  return res.render("admin_users", {
    users,
    error: overrides.error || null,
    createForm: overrides.createForm || { username: "", display_name: "", role: "user" },
    editUser: overrides.editUser || null,
    editForm: overrides.editForm || null,
  });
}

function loadEquipmentForm(res, mode, item, error = null) {
  return res.render("equipment_form", {
    mode,
    item,
    CATEGORIES,
    CONDITIONS,
    error,
  });
}

router.get("/admin", requireAdmin, (req, res) => {
  res.render("admin_dashboard");
});

router.get("/admin/users", requireAdmin, (req, res) => {
  loadUsersPage(res);
});

router.post("/admin/users", requireAdmin, (req, res) => {
  const { error, clean } = validateUserInput(req.body);

  if (error) {
    return loadUsersPage(res, {
      error,
      createForm: {
        username: clean.username,
        display_name: clean.display_name,
        role: clean.role || "user",
      },
    });
  }

  try {
    db.prepare(
      "INSERT INTO users (username, display_name, role, password_hash) VALUES (?, ?, ?, ?)"
    ).run(clean.username, clean.display_name, clean.role, hashPassword(clean.password));
    return res.redirect("/admin/users");
  } catch (e) {
    return loadUsersPage(res, {
      error: "Username already exists.",
      createForm: {
        username: clean.username,
        display_name: clean.display_name,
        role: clean.role,
      },
    });
  }
});

router.get("/admin/users/:id/edit", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const editUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!editUser) return res.status(404).send("User not found");

  return loadUsersPage(res, {
    editUser,
    editForm: {
      username: editUser.username,
      display_name: editUser.display_name,
      role: editUser.role,
    },
  });
});

router.post("/admin/users/:id/edit", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!existing) return res.status(404).send("User not found");

  const { error, clean } = validateUserInput(req.body);
  if (error) {
    return loadUsersPage(res, {
      error,
      editUser: existing,
      editForm: {
        username: clean.username,
        display_name: clean.display_name,
        role: clean.role || existing.role,
      },
    });
  }

  try {
    db.prepare(
      `
      UPDATE users
      SET username = ?, display_name = ?, role = ?, password_hash = ?
      WHERE id = ?
      `
    ).run(clean.username, clean.display_name, clean.role, hashPassword(clean.password), id);

    if (req.session.user.id === id) {
      req.session.user.username = clean.username;
      req.session.user.display_name = clean.display_name;
      req.session.user.role = clean.role;
    }

    return res.redirect("/admin/users");
  } catch (e) {
    return loadUsersPage(res, {
      error: "Username already exists.",
      editUser: existing,
      editForm: {
        username: clean.username,
        display_name: clean.display_name,
        role: clean.role,
      },
    });
  }
});

router.post("/admin/users/:id/delete", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!user) return res.status(404).send("User not found");
  if (req.session.user.id === id) return loadUsersPage(res, { error: "You cannot delete your own account while logged in." });

  const activeCheckouts = db
    .prepare("SELECT COUNT(*) AS c FROM checkouts WHERE user_id = ? AND return_at IS NULL")
    .get(id).c;

  if (activeCheckouts > 0) {
    return loadUsersPage(res, { error: "Cannot delete a user with active checkouts." });
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.redirect("/admin/users");
});

router.get("/admin/equipment", requireAdmin, (req, res) => {
  const items = db.prepare("SELECT * FROM equipment ORDER BY name").all();
  res.render("admin_equipment", { items });
});

router.get("/admin/equipment/new", requireAdmin, (req, res) => {
  loadEquipmentForm(res, "new", null, null);
});

router.post("/admin/equipment/new", requireAdmin, (req, res) => {
  const { error, clean } = validateEquipmentInput(req.body);

  if (error) {
    return loadEquipmentForm(res, "new", clean, error);
  }

  try {
    db.prepare(
      `INSERT INTO equipment (name, category, serial, notes, status, condition)
       VALUES (?, ?, ?, ?, 'available', ?)`
    ).run(clean.name, clean.category, clean.serial, clean.notes, clean.condition);

    res.redirect("/admin/equipment");
  } catch (e) {
    loadEquipmentForm(res, "new", clean, "Serial number already exists.");
  }
});

router.get("/admin/equipment/:id/edit", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
  if (!item) return res.status(404).send("Item not found");

  loadEquipmentForm(res, "edit", item, null);
});

router.post("/admin/equipment/:id/edit", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
  if (!existing) return res.status(404).send("Item not found");

  const { error, clean } = validateEquipmentInput(req.body);

  if (error) {
    return loadEquipmentForm(res, "edit", { ...existing, ...clean }, error);
  }

  try {
    db.prepare(
      `
      UPDATE equipment
      SET name = ?, category = ?, serial = ?, notes = ?, condition = ?
      WHERE id = ?
      `
    ).run(clean.name, clean.category, clean.serial, clean.notes, clean.condition, id);

    res.redirect("/admin/equipment");
  } catch (e) {
    loadEquipmentForm(res, "edit", { ...existing, ...clean }, "Serial number already exists.");
  }
});

router.post("/admin/equipment/:id/delete", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
  if (!item) return res.status(404).send("Item not found");
  if (item.status === "checked_out") return res.status(400).send("Cannot delete checked-out equipment.");

  db.prepare("DELETE FROM equipment WHERE id = ?").run(id);
  res.redirect("/admin/equipment");
});

module.exports = router;
