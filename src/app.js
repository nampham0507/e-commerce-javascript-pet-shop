const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from views folder
app.use(express.static(path.join(__dirname, "../views")));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running" });
});

// Routes - API
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
// app.use('/api/orders', require('./routes/orderRoutes'));
// app.use('/api/customers', require('./routes/customerRoutes'));

// Routes - HTML Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/homepage/index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/admin/index.html"));
});

app.get("/admin/manageCustomer", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/admin/manageCustomer.html"));
});

app.get("/admin/manageProduct", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/admin/manageProduct.html"));
});

app.get("/admin/manageOrder", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/admin/manageOrder.html"));
});

app.get("/admin/report", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/admin/report.html"));
});

app.get("/auth/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/auth/login.html"));
});

app.get("/auth/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/auth/register.html"));
});

app.get("/product", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/product/searchProduct.html"));
});

app.get("/product/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/product/productDetail.html"));
});

app.get("/order/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/order/checkout.html"));
});

app.get("/order/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/order/orderDetail.html"));
});

app.get("/homepage/categories", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/homepage/catagories.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

module.exports = app;
