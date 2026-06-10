// API utility functions for profile management

import { getToken } from "./auth.js";

const API_BASE_URL = "/api";

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

// Get current user's profile
export const getProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    headers: authHeaders(),
  });
  return response.json();
};

// Create/Update profile information
export const updateProfile = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return response.json();
};

// Delete optional profile fields
export const deleteProfileFields = async (fields) => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ fields }),
  });
  return response.json();
};

// Change password
export const changePassword = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/users/change-password`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return response.json();
};

// Shared validation helpers (mirrors backend rules in src/routes/userRoutes.js)
export const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2589]|7[06789]|8[1-9]|9\d)\d{7}$/;
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export const FIELD_LABELS = {
  phone: "Số điện thoại",
  gender: "Giới tính",
  dateOfBirth: "Ngày sinh",
  address: "Địa chỉ",
};
