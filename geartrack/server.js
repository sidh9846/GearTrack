const path = require("path");
const express = require("express");
const session = require("express-session");

const { db, initDbIfNeeded } = require("./db/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "geartrack-dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

initDbIfNeeded();


app.get("/", (req, res) => res.render("welcome"));

app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", adminRoutes);


app.use((req, res) => res.status(404).send("Not Found"));

app.listen(PORT, () => {
  console.log(`GearTrack running at http://localhost:${PORT}`);
});