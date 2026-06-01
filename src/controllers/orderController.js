const Order = require("../models/Order");
const Product = require("../models/Product");

// =============================================
// Helper Functions
// =============================================

/**
 * Tạo mã đơn hàng duy nhất
 * Kết hợp timestamp + chuỗi ngẫu nhiên để đảm bảo không trùng lặp
 */
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Kiểm tra và chuẩn hóa dữ liệu giỏ hàng
 * @param {Array} cart - Mảng sản phẩm từ client
 * @returns {{ valid: boolean, message?: string, items?: Array }}
 */
function normalizeCartItems(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return { valid: false, message: "Giỏ hàng trống." };
  }

  return {
    valid: true,
    items: cart.map((item) => ({
      _id: String(item._id || ""),
      quantity: Number(item.quantity),
    })),
  };
}

/**
 * Hoàn trả số lượng tồn kho khi đơn hàng bị hủy
 * @param {Object} order - Document đơn hàng từ MongoDB
 */
async function restoreInventoryForOrder(order) {
  if (!order?.products?.length) return;

  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantity: item.quantity },
    });
  }
}

// =============================================
// Controller Methods
// =============================================

/**
 * Lấy danh sách đơn hàng của khách hàng đang đăng nhập
 * GET /api/orders
 */
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("user", "fullName email phone")
      .populate("products.product", "name price image category")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * Lấy chi tiết một đơn hàng theo ID
 * GET /api/orders/:orderId
 */
exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "fullName email phone")
      .populate("products.product", "name price image category");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Đơn hàng không tìm thấy" });
    }

    // Kiểm tra quyền sở hữu đơn hàng
    if (order.user._id.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền xem đơn hàng này" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * Tạo đơn hàng mới
 * POST /api/orders
 */
exports.createOrder = async (req, res) => {
  try {
    const { paymentMethod, shippingAddress, cart, totalPrice } = req.body;

    // Validate giỏ hàng
    const normalizedCart = normalizeCartItems(cart);
    if (!normalizedCart.valid) {
      return res
        .status(400)
        .json({ success: false, message: normalizedCart.message });
    }

    // Validate phương thức thanh toán
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Phương thức thanh toán không hợp lệ.",
      });
    }

    // Validate thông tin giao hàng
    if (!shippingAddress?.address || !shippingAddress?.phone) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin giao hàng.",
      });
    }

    // Tính toán giá và kiểm tra tồn kho
    let subtotal = 0;
    const products = [];

    for (const item of normalizedCart.items) {
      const product = await Product.findById(item._id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm ${item._id}`,
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" chỉ còn ${product.quantity} chiếc, không đủ đặt hàng.`,
        });
      }

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng sản phẩm không hợp lệ.",
        });
      }

      const qty = Math.floor(item.quantity);
      products.push({
        product: product._id,
        quantity: qty,
        price: product.price,
      });
      subtotal += product.price * qty;
    }

    // Tính tổng tiền (gồm phí ship)
    const shippingFee = 30000;
    const total = subtotal + shippingFee;

    if (Number(totalPrice) !== total) {
      return res
        .status(400)
        .json({ success: false, message: "Tổng tiền không hợp lệ." });
    }

    // Tạo đơn hàng
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.userId,
      products,
      totalPrice: total,
      status: "pending",
      shippingAddress: {
        fullName: shippingAddress.fullName || "",
        address: shippingAddress.address,
        city: shippingAddress.city || "",
        phone: shippingAddress.phone,
      },
      paymentMethod,
      paymentGateway: paymentMethod === "banking" ? "vnpay" : null,
      paymentStatus: paymentMethod === "banking" ? "pending" : "unpaid",
    });

    // Trừ tồn kho
    for (const item of products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }

    return res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể tạo đơn hàng.",
      error: error.message,
    });
  }
};

/**
 * Hủy đơn hàng
 * PATCH /api/orders/:orderId/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { cancelReason } = req.body;

    if (!cancelReason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn lý do hủy đơn.",
      });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Đơn hàng không tìm thấy." });
    }

    // Kiểm tra quyền sở hữu
    if (order.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền hủy đơn hàng này." });
    }

    if (order.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Đơn hàng đã được hủy trước đó." });
    }

    // Chỉ cho phép hủy đơn ở trạng thái pending hoặc confirmed
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn hàng ở trạng thái hiện tại.",
      });
    }

    // Cập nhật trạng thái hủy
    order.status = "cancelled";
    order.cancelReason = cancelReason;
    order.cancelledAt = new Date();
    await order.save();

    // Hoàn trả tồn kho
    await restoreInventoryForOrder(order);

    return res.json({
      success: true,
      message: "Hủy đơn hàng thành công.",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể hủy đơn hàng.",
      error: error.message,
    });
  }
};
