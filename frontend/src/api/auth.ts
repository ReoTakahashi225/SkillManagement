import axiosInstance from './axiosConfig';
import type { User } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
}

// Re-export User type for backward compatibility
export type { User };

// Login user
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/auth/login', {
    username,
    password,
  });
  return response.data;
};

// Register new user
export const register = async (data: RegisterData): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

// Get current user
export const getCurrentUser = async (token: string): Promise<{ user: User }> => {
  const response = await axiosInstance.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<{ message: string }> => {
  const response = await axiosInstance.post(
    '/users/change-password',
    { currentPassword, newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};
