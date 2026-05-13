// Admin API utility functions

const API_BASE_URL = "http://localhost:5000/api";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Header with authorization
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Dashboard API
export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Product Management
export const getAdminProducts = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/products?${query}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createProduct = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateProduct = async (productId, data) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getProductStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products/stats/all`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Order Management
export const getAdminOrders = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/orders?${query}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getOrderDetail = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteOrder = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getOrderStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/stats/all`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Customer Management
export const getAdminCustomers = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/customers?${query}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getCustomerDetail = async (customerId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/customers/${customerId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getCustomerStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/customers/stats/all`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// User Management
export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createAdmin = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/create-admin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/update-role`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, role }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/delete-user/${userId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};
