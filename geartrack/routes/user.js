const express = require("express");
const { db } = require("../db/db");
const router = express.Router();

const CATEGORIES = ["Controller", "Mixer", "Speaker", "Microphone", "Lighting", "Stand", "Accessory"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Damaged"];

function requireUser(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}
function requireNonAdmin(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  if (req.session.user.role !== "user") return res.redirect("/admin");
  next();
}

router.get("/user", requireUser, requireNonAdmin, (req, res) => {
  res.redirect("/inventory");
});

router.get("/inventory", requireUser, requireNonAdmin, (req, res) => {
  const items = db
    .prepare(
      `
      SELECT e.*,
        (
          SELECT u.display_name
          FROM checkouts c
          JOIN users u ON u.id = c.user_id
          WHERE c.equipment_id = e.id AND c.return_at IS NULL
        ) AS checked_out_by
      FROM equipment e
      ORDER BY e.name
      `
    )
    .all();

  res.render("inventory", { items });
});

router.get("/inventory/:id", requireUser, requireNonAdmin, (req, res) => {
  const id = Number(req.params.id);

  const item = db
    .prepare(
      `
      SELECT e.*,
        (
          SELECT u.display_name
          FROM checkouts c
          JOIN users u ON u.id = c.user_id
          WHERE c.equipment_id = e.id AND c.return_at IS NULL
        ) AS checked_out_by
      FROM equipment e
      WHERE e.id = ?
      `
    )
    .get(id);

  if (!item) return res.status(404).send("Item not found");

  const activeCheckout = db
    .prepare(
      `
      SELECT c.*, u.display_name
      FROM checkouts c
      JOIN users u ON u.id = c.user_id
      WHERE c.equipment_id = ? AND c.return_at IS NULL
      `
    )
    .get(id);

  res.render("item", { item, activeCheckout, CONDITIONS });
});

router.post("/inventory/:id/checkout", requireUser, requireNonAdmin, (req, res) => {
  const equipmentId = Number(req.params.id);
  const userId = req.session.user.id;
  const { checkout_condition, checkout_notes } = req.body;

  if (!CONDITIONS.includes(checkout_condition)) {
    return res.status(400).send("Invalid condition");
  }

  const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(equipmentId);
  if (!item) return res.status(404).send("Item not found");
  if (item.status !== "available") return res.status(400).send("Item not available");

  const tx = db.transaction(() => {
    db.prepare(
      `
      INSERT INTO checkouts (equipment_id, user_id, checkout_condition, checkout_notes)
      VALUES (?, ?, ?, ?)
      `
    ).run(equipmentId, userId, checkout_condition, checkout_notes || null);

    db.prepare(
      `UPDATE equipment SET status = 'checked_out', condition = ? WHERE id = ?`
    ).run(checkout_condition, equipmentId);
  });

  try {
    tx();
    res.redirect(`/inventory/${equipmentId}`);
  } catch (e) {
    res.status(400).send("Unable to checkout (item may already be checked out).");
  }
});

router.get("/my-equipment", requireUser, requireNonAdmin, (req, res) => {
  const userId = req.session.user.id;

  const items = db
    .prepare(
      `
      SELECT e.*, c.id AS checkout_id, c.checkout_at, c.checkout_condition
      FROM checkouts c
      JOIN equipment e ON e.id = c.equipment_id
      WHERE c.user_id = ? AND c.return_at IS NULL
      ORDER BY c.checkout_at DESC
      `
    )
    .all(userId);

  res.render("my_equipment", { items, CONDITIONS });
});

router.post("/my-equipment/:checkoutId/return", requireUser, requireNonAdmin, (req, res) => {
  const checkoutId = Number(req.params.checkoutId);
  const userId = req.session.user.id;
  const { return_condition, return_notes } = req.body;

  if (!CONDITIONS.includes(return_condition)) {
    return res.status(400).send("Invalid condition");
  }

  const checkout = db
    .prepare(
      `
      SELECT * FROM checkouts
      WHERE id = ? AND user_id = ? AND return_at IS NULL
      `
    )
    .get(checkoutId, userId);

  if (!checkout) return res.status(404).send("Active checkout not found");

  const tx = db.transaction(() => {
    db.prepare(
      `
      UPDATE checkouts
      SET return_at = datetime('now'),
          return_condition = ?,
          return_notes = ?
      WHERE id = ?
      `
    ).run(return_condition, return_notes || null, checkoutId);

    db.prepare(
      `UPDATE equipment SET status = 'available', condition = ? WHERE id = ?`
    ).run(return_condition, checkout.equipment_id);
  });

  tx();
  res.redirect("/my-equipment");
});

router.get("/log", requireUser, requireNonAdmin, (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT c.*,
             e.name AS equipment_name,
             e.serial AS equipment_serial,
             u.display_name AS user_name
      FROM checkouts c
      JOIN equipment e ON e.id = c.equipment_id
      JOIN users u ON u.id = c.user_id
      ORDER BY c.checkout_at DESC
      LIMIT 200
      `
    )
    .all();

  res.render("log", { rows });
});

module.exports = router;