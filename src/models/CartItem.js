const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { timestamps: true }
);

// Đảm bảo không trùng sản phẩm trong cùng 1 giỏ hàng
cartItemSchema.index({ cart: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("CartItem", cartItemSchema);
