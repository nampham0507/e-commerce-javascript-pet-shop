import { getToken, isAuthenticated } from "./auth.js";

const API_BASE_URL = "/api";

// ── Helpers cơ bản (phải khai báo trước để các hàm khác dùng được) ──────────

export const getCart = () => {
  const cart = localStorage.getItem("cart");
  return cart ? JSON.parse(cart) : [];
};

export const getCartTotal = () => {
  return getCart().reduce((total, item) => total + item.price * item.quantity, 0);
};

export const getCartItemCount = () => {
  return getCart().reduce((count, item) => count + item.quantity, 0);
};

// ── Merge giỏ hàng local lên backend ────────────────────────────────────────

export const mergeLocalCartToBackend = async () => {
  if (!isAuthenticated()) return;
  const localCart = getCart();
  if (localCart.length === 0) return;
  const token = getToken();
  try {
    for (const item of localCart) {
      await fetch(`${API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: item._id, quantity: item.quantity }),
      });
    }
    // Sau khi merge xong, tải lại từ backend
    await syncCartFromBackend();
  } catch (error) {
    console.error("Lỗi merge giỏ hàng lên backend:", error);
  }
};

// ── Đồng bộ giỏ hàng từ backend về LocalStorage ─────────────────────────────

export const syncCartFromBackend = async () => {
  if (!isAuthenticated()) return getCart();
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (result.success) {
      // Backend rỗng nhưng local có dữ liệu → merge local lên backend
      if (result.cart.length === 0) {
        const localCart = getCart();
        if (localCart.length > 0) {
          await mergeLocalCartToBackend();
          return getCart();
        }
        localStorage.setItem("cart", JSON.stringify([]));
        return [];
      }
      // Map backend → frontend format
      const cart = result.cart.map((item) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        quantity: item.quantity,
      }));
      localStorage.setItem("cart", JSON.stringify(cart));
      return cart;
    }
  } catch (error) {
    console.error("Lỗi đồng bộ giỏ hàng từ backend:", error);
  }
  return getCart();
};

// ── Thêm sản phẩm vào giỏ ───────────────────────────────────────────────────

export const addToCart = (product, quantity = 1) => {
  if (!isAuthenticated()) {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
    window.location.href = "/auth/login";
    return null;
  }

  const cart = getCart();
  const existingItem = cart.find((item) => item._id === product._id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    });
  }
  localStorage.setItem("cart", JSON.stringify(cart));

  // Đồng bộ ngầm lên backend (luôn chạy vì đã check đăng nhập)
  fetch(`${API_BASE_URL}/cart/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ productId: product._id, quantity }),
  }).catch((err) => console.error("Lỗi đồng bộ thêm giỏ hàng:", err));

  return cart;
};

// ── Xóa sản phẩm khỏi giỏ ───────────────────────────────────────────────────

export const removeFromCart = async (productId) => {
  const cart = getCart().filter((item) => item._id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));

  if (isAuthenticated()) {
    try {
      await fetch(`${API_BASE_URL}/cart/item/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      console.error("Lỗi đồng bộ xóa giỏ hàng:", err);
    }
  }

  return cart;
};

// ── Cập nhật số lượng ────────────────────────────────────────────────────────

export const updateCartQuantity = async (productId, quantity) => {
  const cart = getCart();
  const item = cart.find((item) => item._id === productId);
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
    localStorage.setItem("cart", JSON.stringify(cart));

    if (isAuthenticated()) {
      try {
        await fetch(`${API_BASE_URL}/cart/item/${productId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ quantity }),
        });
      } catch (err) {
        console.error("Lỗi đồng bộ cập nhật số lượng:", err);
      }
    }
  }
  return getCart();
};

// ── Xóa toàn bộ giỏ ─────────────────────────────────────────────────────────

export const clearCart = () => {
  localStorage.removeItem("cart");

  if (isAuthenticated()) {
    fetch(`${API_BASE_URL}/cart/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch((err) => console.error("Lỗi đồng bộ làm sạch giỏ hàng:", err));
  }
};
