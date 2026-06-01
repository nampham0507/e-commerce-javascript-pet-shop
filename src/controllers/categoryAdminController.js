const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Product = require("../models/Product");

const formatName = (value) => value?.trim() || "";

const ensureBrandsFromProducts = async () => {
  try {
    const existingBrandNames = new Set(
      (await Brand.find({}).select("name").lean()).map((brand) => brand.name)
    );

    const productBrands = await Product.distinct("brand", {
      brand: { $exists: true, $ne: "" },
    });

    const normalizedProductBrands = [
      ...new Set(productBrands.map((name) => formatName(name)).filter(Boolean)),
    ];

    const newBrands = normalizedProductBrands
      .filter((name) => !existingBrandNames.has(name))
      .map((name) => ({ name }));

    if (newBrands.length > 0) {
      await Brand.insertMany(newBrands, { ordered: false });
    }
  } catch (error) {
    console.error("Lỗi khi đồng bộ thương hiệu:", error);
  }
};

const getFallbackBrandsFromProducts = async () => {
  const productBrands = await Product.distinct("brand", {
    brand: { $exists: true, $ne: "" },
  });

  return [
    ...new Set(productBrands.map((name) => formatName(name)).filter(Boolean)),
  ]
    .sort()
    .map((name) => ({ name }));
};

exports.getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicBrands = async (req, res) => {
  try {
    await ensureBrandsFromProducts();
    let brands = await Brand.find({}).sort({ name: 1 });
    if (brands.length === 0) {
      brands = await getFallbackBrandsFromProducts();
    }
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const name = formatName(req.body.name);
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Tên danh mục không được để trống" });
    }
    const category = new Category({ name });
    await category.save();
    res
      .status(201)
      .json({ success: true, message: "Tạo danh mục thành công", category });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Danh mục đã tồn tại" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const name = formatName(req.body.name);
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Tên danh mục không được để trống" });
    }
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Danh mục không tồn tại" });
    }
    const oldSlug = category.slug;
    category.name = name;
    await category.save();
    await Product.updateMany(
      { category: oldSlug },
      { category: category.slug }
    );
    res.json({
      success: true,
      message: "Cập nhật danh mục thành công",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Danh mục đã tồn tại" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Danh mục không tồn tại" });
    }
    const assignedProducts = await Product.countDocuments({
      category: category.slug,
    });
    if (assignedProducts > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa danh mục vì còn sản phẩm đang sử dụng",
      });
    }
    await Category.findByIdAndDelete(categoryId);
    res.json({ success: true, message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBrandsAdmin = async (req, res) => {
  try {
    await ensureBrandsFromProducts();
    let brands = await Brand.find({}).sort({ name: 1 });
    if (brands.length === 0) {
      brands = await getFallbackBrandsFromProducts();
    }
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const name = formatName(req.body.name);
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tên thương hiệu không được để trống",
      });
    }
    const brand = new Brand({ name });
    await brand.save();
    res
      .status(201)
      .json({ success: true, message: "Tạo thương hiệu thành công", brand });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Thương hiệu đã tồn tại" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const name = formatName(req.body.name);
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tên thương hiệu không được để trống",
      });
    }
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Thương hiệu không tồn tại" });
    }
    brand.name = name;
    await brand.save();
    res.json({
      success: true,
      message: "Cập nhật thương hiệu thành công",
      brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Thương hiệu đã tồn tại" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Thương hiệu không tồn tại" });
    }
    const assignedProducts = await Product.countDocuments({
      brand: brand.name,
    });
    if (assignedProducts > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa thương hiệu vì còn sản phẩm đang sử dụng",
      });
    }
    await Brand.findByIdAndDelete(brandId);
    res.json({ success: true, message: "Xóa thương hiệu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
