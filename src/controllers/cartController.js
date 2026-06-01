const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId });
  }
  return cart;
};

exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    const cartItems = await CartItem.find({ cart: cart._id }).populate(
      "product"
    );
    res.json({ success: true, cart: cartItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin sản phẩm" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    const cart = await getOrCreateCart(req.userId);
    let cartItem = await CartItem.findOne({
      cart: cart._id,
      product: productId,
    });

    if (cartItem) {
      cartItem.quantity += qty;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cart: cart._id,
        product: productId,
        quantity: qty,
      });
    }

    res.json({ success: true, message: "Đã thêm vào giỏ hàng", cartItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (qty < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Số lượng không hợp lệ" });
    }

    const cart = await getOrCreateCart(req.userId);
    const cartItem = await CartItem.findOne({
      cart: cart._id,
      $or: [
        { product: itemId },
        {
          _id: require("mongoose").Types.ObjectId.isValid(itemId)
            ? itemId
            : null,
        },
      ],
    });

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ" });
    }

    cartItem.quantity = qty;
    await cartItem.save();

    res.json({ success: true, message: "Đã cập nhật số lượng", cartItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.userId);
    const cartItem = await CartItem.findOneAndDelete({
      cart: cart._id,
      $or: [
        { product: itemId },
        {
          _id: require("mongoose").Types.ObjectId.isValid(itemId)
            ? itemId
            : null,
        },
      ],
    });

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ" });
    }

    res.json({ success: true, message: "Đã xóa khỏi giỏ hàng" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    await CartItem.deleteMany({ cart: cart._id });
    res.json({ success: true, message: "Đã làm sạch giỏ hàng" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
