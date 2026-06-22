// Admin API utility functions

const API_BASE_URL = "/api";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Header with authorization
const getAuthHeaders = (isFormData = false) => {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

// Token đã hết hạn hoặc không còn hợp lệ (ví dụ sau khi reseed database):
// xóa thông tin đăng nhập cũ và đưa người dùng về trang đăng nhập.
const handleAuthExpired = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (!window.location.pathname.startsWith("/auth/login")) {
    window.location.href = "/auth/login";
  }
};

// Wrapper chung cho mọi request admin: tự động xử lý 401 (token hết hạn/không hợp lệ)
// để tránh tình trạng trang quản trị "không lấy được dữ liệu" mà không rõ lý do.
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    if (response.status === 401) {
      handleAuthExpired();
      return {
        success: false,
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }

    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Report Stats API (date-range filtered)
export const getReportStats = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(
    `${API_BASE_URL}/admin/reports/stats${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders() }
  );
};

// Dashboard API
export const getDashboardStats = async () => {
  return apiRequest(`${API_BASE_URL}/admin/dashboard`, {
    headers: getAuthHeaders(),
  });
};

// Product Management
export const getAdminProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`${API_BASE_URL}/admin/products?${query}`, {
    headers: getAuthHeaders(),
  });
};

export const createProduct = async (data) => {
  const isFormData = data instanceof FormData;
  return apiRequest(`${API_BASE_URL}/admin/products`, {
    method: "POST",
    headers: getAuthHeaders(isFormData),
    body: isFormData ? data : JSON.stringify(data),
  });
};

export const updateProduct = async (productId, data) => {
  const isFormData = data instanceof FormData;
  return apiRequest(`${API_BASE_URL}/admin/products/${productId}`, {
    method: "PUT",
    headers: getAuthHeaders(isFormData),
    body: isFormData ? data : JSON.stringify(data),
  });
};

export const deleteProduct = async (productId) => {
  return apiRequest(`${API_BASE_URL}/admin/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const getAdminCategories = async () => {
  return apiRequest(`${API_BASE_URL}/admin/categories`, {
    headers: getAuthHeaders(),
  });
};

export const createCategory = async (data) => {
  return apiRequest(`${API_BASE_URL}/admin/categories`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateCategory = async (categoryId, data) => {
  return apiRequest(`${API_BASE_URL}/admin/categories/${categoryId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const deleteCategory = async (categoryId) => {
  return apiRequest(`${API_BASE_URL}/admin/categories/${categoryId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const getAdminBrands = async () => {
  return apiRequest(`${API_BASE_URL}/admin/brands`, {
    headers: getAuthHeaders(),
  });
};

export const createBrand = async (data) => {
  return apiRequest(`${API_BASE_URL}/admin/brands`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateBrand = async (brandId, data) => {
  return apiRequest(`${API_BASE_URL}/admin/brands/${brandId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const deleteBrand = async (brandId) => {
  return apiRequest(`${API_BASE_URL}/admin/brands/${brandId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const getProductStats = async () => {
  return apiRequest(`${API_BASE_URL}/admin/products/stats/all`, {
    headers: getAuthHeaders(),
  });
};

// Order Management
export const getAdminOrders = async (params = {}) => {
  const filteredParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      filteredParams[key] = value;
    }
  });
  const query = new URLSearchParams(filteredParams).toString();
  return apiRequest(
    `${API_BASE_URL}/admin/orders${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders() }
  );
};

export const getOrderDetail = async (orderId) => {
  return apiRequest(`${API_BASE_URL}/admin/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
};

export const updateOrderStatus = async (orderId, status) => {
  return apiRequest(`${API_BASE_URL}/admin/orders/${orderId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
};

export const deleteOrder = async (orderId) => {
  return apiRequest(`${API_BASE_URL}/admin/orders/${orderId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

export const createAdminOrder = async (data) => {
  const url =
    typeof window !== "undefined" && window.location && window.location.origin
      ? `${window.location.origin}${API_BASE_URL}/admin/orders`
      : `${API_BASE_URL}/admin/orders`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      handleAuthExpired();
      return {
        success: false,
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: json.message || text,
          body: json,
        };
      }
      return json;
    } catch (e) {
      // Non-JSON response
      return { success: response.ok, status: response.status, message: text };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getOrderStats = async () => {
  return apiRequest(`${API_BASE_URL}/admin/orders/stats/all`, {
    headers: getAuthHeaders(),
  });
};

// Customer Management
export const getAdminCustomers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`${API_BASE_URL}/admin/customers?${query}`, {
    headers: getAuthHeaders(),
  });
};

export const getCustomerDetail = async (customerId) => {
  return apiRequest(`${API_BASE_URL}/admin/customers/${customerId}`, {
    headers: getAuthHeaders(),
  });
};

export const getCustomerStats = async () => {
  return apiRequest(`${API_BASE_URL}/admin/customers/stats/all`, {
    headers: getAuthHeaders(),
  });
};

// User Management
export const getAllUsers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`${API_BASE_URL}/admin/users?${query}`, {
    headers: getAuthHeaders(),
  });
};

export const createAdmin = async (data) => {
  return apiRequest(`${API_BASE_URL}/admin/create-admin`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

// Create general user (admin can create customers or admins)
export const createUser = async (data) => {
  // If creating admin, use admin endpoint which enforces admin role
  if (data.role === "admin") {
    return await createAdmin(data);
  }

  // Otherwise register via auth endpoint (creates customer by default)
  return apiRequest(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateUserRole = async (userId, role) => {
  return apiRequest(`${API_BASE_URL}/admin/update-role`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, role }),
  });
};

export const updateUserDetails = async (userId, data) => {
  return apiRequest(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const deleteUser = async (userId) => {
  return apiRequest(`${API_BASE_URL}/admin/delete-user/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
};

// Review Management
export const getAdminReviews = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(
    `${API_BASE_URL}/admin/reviews${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders() }
  );
};
