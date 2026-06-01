const express = require("express");
const router = express.Router();
const categoryAdminController = require("../controllers/categoryAdminController");

router.get("/", categoryAdminController.getPublicCategories);
router.get("/brands", categoryAdminController.getPublicBrands);

module.exports = router;
