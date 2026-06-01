const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");

// /api/brands/ -> Lấy danh sách thương hiệu (chính)
router.get("/", brandController.getPublicBrands);

// /api/brands/categories -> Lấy danh sách danh mục (dựa theo brand/product)
router.get("/categories", brandController.getPublicCategories);

module.exports = router;
