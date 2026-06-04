import { getToken, isAuthenticated, getUserInfo } from "./auth.js";

const API_BASE_URL = "/api";

// ── Key giỏ hàng theo user (tránh share giữa các user trên cùng browser) ──────
// Mỗi user có 1 key riêng: cart_<userId>, guest dùng cart_guest

const getCartKey = () => {
  const user = getUserInfo();
  const userId = user?.id || user?._id;
  return userId ? `cart_${userId}` : "cart_guest";
};

// ── Helpers cơ bản ────────────────────────────────────────────────────────────

export const getCart = () => {
  const cart = localStorage.getItem(getCartKey());
  return cart ? JSON.parse(cart) : [];
};

export const getCartTotal = () => {
  return getCart().reduce((total, item) => total + item.price * item.quantity, 0);
};

export const getCartItemCount = () => {
  return getCart().reduce((count, item) => count + item.quantity, 0);
};

// ── Đồng bộ giỏ hàng từ backend về LocalStorage ──────────────────────────────

export const syncCartFromBackend = async () => {
  if (!isAuthenticated()) return getCart();
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (result.success) {
      const cartKey = getCartKey();
      if (result.cart.length === 0) {
        // Backend rỗng → xóa local, KHÔNG merge để tránh cart cũ của user khác bị ghép vào
        localStorage.setItem(cartKey, JSON.stringify([]));
        return [];
      }
      // Map backend → frontend format (bỏ qua các sản phẩm đã bị xóa khỏi DB)
      const validItems = result.cart.filter((item) => item.product != null);
      const cart = validItems.map((item) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        quantity: item.quantity,
      }));
      localStorage.setItem(cartKey, JSON.stringify(cart));
      return cart;
    }
  } catch (error) {
    console.error("Lỗi đồng bộ giỏ hàng từ backend:", error);
  }
  return getCart();
};

// ── Merge giỏ hàng guest local lên backend (chỉ dùng khi login) ─────────────

export const mergeLocalCartToBackend = async () => {
  if (!isAuthenticated()) return;
  
  // Lấy giỏ hàng của guest (trước khi đăng nhập)
  const guestCartStr = localStorage.getItem("cart_guest");
  const guestCart = guestCartStr ? JSON.parse(guestCartStr) : [];
  
  if (guestCart.length === 0) return;
  
  const token = getToken();
  try {
    for (const item of guestCart) {
      await fetch(`${API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: item._id, quantity: item.quantity }),
      });
    }
    // Xóa giỏ hàng guest sau khi merge xong
    localStorage.removeItem("cart_guest");
    await syncCartFromBackend();
  } catch (error) {
    console.error("Lỗi merge giỏ hàng lên backend:", error);
  }
};

// ── Thêm sản phẩm vào giỏ ────────────────────────────────────────────────────

export const addToCart = async (product, quantity = 1) => {
  if (!isAuthenticated()) {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
    window.location.href = "/auth/login";
    return null;
  }

  // Đồng bộ lên backend trước
  try {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ productId: product._id, quantity }),
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error("Lỗi từ backend:", result.message);
      alert("Không thể thêm vào giỏ hàng: " + result.message);
      return null;
    }
  } catch (err) {
    console.error("Lỗi đồng bộ thêm giỏ hàng:", err);
    alert("Lỗi kết nối khi thêm vào giỏ hàng");
    return null;
  }

  // Cập nhật local storage sau khi backend thành công
  const cartKey = getCartKey();
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
  localStorage.setItem(cartKey, JSON.stringify(cart));

  return cart;
};

// ── Xóa sản phẩm khỏi giỏ ────────────────────────────────────────────────────

export const removeFromCart = async (productId) => {
  const cartKey = getCartKey();
  const cart = getCart().filter((item) => item._id !== productId);
  localStorage.setItem(cartKey, JSON.stringify(cart));

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

// ── Cập nhật số lượng ─────────────────────────────────────────────────────────

export const updateCartQuantity = async (productId, quantity) => {
  const cartKey = getCartKey();
  const cart = getCart();
  const item = cart.find((item) => item._id === productId);
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
    localStorage.setItem(cartKey, JSON.stringify(cart));

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

// ── Xóa toàn bộ giỏ ──────────────────────────────────────────────────────────

export const clearCart = () => {
  localStorage.removeItem(getCartKey());

  if (isAuthenticated()) {
    fetch(`${API_BASE_URL}/cart/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch((err) => console.error("Lỗi đồng bộ làm sạch giỏ hàng:", err));
  }
};
