const Product = require("../models/Product");

// Get products with filter (admin)
exports.getProductsAdmin = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, quantity, image } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    const product = new Product({
      name,
      description,
      category,
      price,
      quantity: quantity || 0,
      image,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Update product (admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, category, price, quantity, image } = req.body;

    let product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tìm thấy",
      });
    }

    product = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        category,
        price,
        quantity,
        image,
        updatedAt: Date.now(),
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tìm thấy",
      });
    }

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Get product stats (admin)
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
    ]);

    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalQty: { $sum: "$quantity" },
        },
      },
    ]);

    const lowStockProducts = await Product.find({
      quantity: { $lt: 10 },
    }).limit(10);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalInventoryValue: totalValue[0]?.total || 0,
        productsByCategory,
        lowStockProducts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
