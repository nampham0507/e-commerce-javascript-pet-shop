import { getToken, isAuthenticated } from "./auth.js";

const API_BASE_URL = "/api";

// Hàm đồng bộ giỏ hàng từ backend về LocalStorage
export const syncCartFromBackend = async () => {
  if (!isAuthenticated()) return [];
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (result.success) {
      // Map từ backend format sang frontend format
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

// Hàm đẩy giỏ hàng hiện tại (khi chưa đăng nhập) lên backend sau khi vừa đăng nhập
export const mergeLocalCartToBackend = async () => {
  if (!isAuthenticated()) return;
  const localCart = getCart();
  if (localCart.length === 0) return;
  const token = getToken();
  try {
    // Đẩy từng sản phẩm lên backend
    for (const item of localCart) {
      await fetch(`${API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item._id,
          quantity: item.quantity,
        }),
      });
    }
    // Sau khi merge xong, tải lại giỏ hàng từ backend để cập nhật LocalStorage đồng bộ nhất
    await syncCartFromBackend();
  } catch (error) {
    console.error("Lỗi merge giỏ hàng lên backend:", error);
  }
};

// Cart Management
export const addToCart = (product, quantity = 1) => {
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

  // Đồng bộ ngầm lên backend nếu đã đăng nhập
  if (isAuthenticated()) {
    const token = getToken();
    fetch(`${API_BASE_URL}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: product._id,
        quantity,
      }),
    }).catch((err) => console.error("Lỗi đồng bộ thêm giỏ hàng:", err));
  }

  return cart;
};

export const removeFromCart = (productId) => {
  let cart = getCart();
  cart = cart.filter((item) => item._id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));

  // Đồng bộ ngầm lên backend nếu đã đăng nhập
  if (isAuthenticated()) {
    const token = getToken();
    fetch(`${API_BASE_URL}/cart/item/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((err) => console.error("Lỗi đồng bộ xóa giỏ hàng:", err));
  }

  return cart;
};

export const updateCartQuantity = (productId, quantity) => {
  const cart = getCart();
  const item = cart.find((item) => item._id === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      item.quantity = quantity;
      localStorage.setItem("cart", JSON.stringify(cart));

      // Đồng bộ ngầm lên backend nếu đã đăng nhập
      if (isAuthenticated()) {
        const token = getToken();
        fetch(`${API_BASE_URL}/cart/item/${productId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity,
          }),
        }).catch((err) => console.error("Lỗi đồng bộ cập nhật số lượng:", err));
      }
    }
  }
  return getCart();
};

export const getCart = () => {
  const cart = localStorage.getItem("cart");
  return cart ? JSON.parse(cart) : [];
};

export const clearCart = () => {
  localStorage.removeItem("cart");

  // Đồng bộ ngầm lên backend nếu đã đăng nhập
  if (isAuthenticated()) {
    const token = getToken();
    fetch(`${API_BASE_URL}/cart/clear`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((err) => console.error("Lỗi đồng bộ làm sạch giỏ hàng:", err));
  }
};

export const getCartTotal = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const getCartItemCount = () => {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
};
