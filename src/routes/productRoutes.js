const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const productAdminController = require("../controllers/productAdminController");
const { body, validationResult } = require("express-validator");

// ===== PUBLIC ROUTES (No Auth Required) =====

// Get all products (public)
router.get("/public", productAdminController.getPublicProducts);

// Get product by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get products by category (public)
router.get("/category/:category", async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.category.toLowerCase(),
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
