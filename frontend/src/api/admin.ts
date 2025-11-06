import axiosInstance from './axiosConfig';
import type { UsersResponse, UserDetailResponse, DashboardStatsResponse, User } from '../types';

export interface CreateUserData {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  full_name?: string;
  role?: 'user' | 'admin';
}

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (token: string, search?: string): Promise<UsersResponse> => {
  const params = search ? { search } : {};
  const response = await axiosInstance.get('/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
  return response.data;
};

/**
 * Get user detail by ID (admin only)
 */
export const getUserById = async (userId: number, token: string): Promise<UserDetailResponse> => {
  const response = await axiosInstance.get(`/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get dashboard statistics (admin only)
 */
export const getDashboardStats = async (token: string): Promise<DashboardStatsResponse> => {
  const response = await axiosInstance.get('/admin/stats', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Create new user (admin only)
 */
export const createUser = async (data: CreateUserData, token: string): Promise<{ user: User }> => {
  const response = await axiosInstance.post('/admin/users', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

/**
 * Update user (admin only)
 */
export const updateUser = async (
  userId: number,
  data: UpdateUserData,
  token: string
): Promise<{ user: User }> => {
  const response = await axiosInstance.put(`/admin/users/${userId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (userId: number, token: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Import work experiences from JSON (admin only)
 */
export const importWorkExperiences = async (
  userId: number,
  workExperiences: any[],
  token: string
): Promise<{ message: string; imported: any[]; errors?: string[] }> => {
  const response = await axiosInstance.post(
    `/admin/users/${userId}/import`,
    { workExperiences },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

/**
 * Import work experiences from file (PDF/Excel) using Gemini API (admin only)
 */
export const importWorkExperiencesFromFile = async (
  userId: number,
  file: File,
  token: string
): Promise<{ message: string; imported: any[]; errors?: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post(
    `/admin/users/${userId}/import-file`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Change user password (admin only)
 */
export const changeUserPassword = async (
  userId: number,
  newPassword: string,
  token: string
): Promise<{ message: string }> => {
  const response = await axiosInstance.post(
    `/admin/users/${userId}/change-password`,
    { newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};
