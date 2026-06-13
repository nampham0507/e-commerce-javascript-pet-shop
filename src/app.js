const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");

const app = express();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Block direct access to .ejs template sources before they hit the static handler
app.use((req, res, next) => {
  if (req.path.endsWith(".ejs")) {
    return res.status(404).end();
  }
  next();
});

// Serve static assets (images, css, js, uploads) from the views folder
app.use(express.static(path.join(__dirname, "views")));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running" });
});

// Routes - API
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/auth", require("./routes/authRoutes")); // Also mount at /auth for direct access
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/replies", require("./routes/replyRoutes"));
app.use("/api/payments", require("./routes/vnpayRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
// app.use('/api/customers', require('./routes/customerRoutes'));

// Routes - HTML Pages
app.get("/", (req, res) => {
  res.render("homepage/index", { activePage: "home" });
});

app.get("/admin", (req, res) => {
  res.render("admin/index", { activePage: "dashboard" });
});

app.get("/admin/manageCustomer", (req, res) => {
  res.render("admin/manageCustomer", { activePage: "users" });
});

app.get("/admin/manageProduct", (req, res) => {
  res.render("admin/manageProduct", { activePage: "products" });
});

app.get("/admin/manageBrand", (req, res) => {
  res.render("admin/manageBrand", { activePage: "brands" });
});

app.get("/admin/manageCategory", (req, res) => {
  res.render("admin/manageCategory", { activePage: "categories" });
});

app.get("/admin/manageOrder", (req, res) => {
  res.render("admin/manageOrder", { activePage: "orders" });
});

app.get("/admin/report", (req, res) => {
  res.render("admin/report", { activePage: "reports" });
});

app.get("/admin/manageReviews", (req, res) => {
  res.render("admin/manageReviews", { activePage: "reviews" });
});

app.get("/auth/login", (req, res) => {
  res.render("auth/login");
});

app.get("/auth/register", (req, res) => {
  res.render("auth/register");
});

app.get("/product", (req, res) => {
  res.render("product/searchProduct", { activePage: "products" });
});

app.get("/product/detail", (req, res) => {
  res.render("product/productDetail", { activePage: "products" });
});

app.get("/cart", (req, res) => {
  res.render("cart/cart", { activePage: "cart" });
});

app.get("/order/checkout", (req, res) => {
  res.render("order/checkout", { activePage: "" });
});

app.get("/order/detail", (req, res) => {
  res.render("order/orderDetail", { activePage: "" });
});

app.get("/homepage/categories", (req, res) => {
  res.render("homepage/categories", { activePage: "categories" });
});

app.get("/profile", (req, res) => {
  res.render("profile/profile", { activePage: "" });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

module.exports = app;
