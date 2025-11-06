import axiosInstance from './axiosConfig';
import type { WorkExperiencesResponse, WorkExperienceResponse, UserProfileResponse } from '../types';

/**
 * 業務実績一覧を取得
 */
export const getWorkExperiences = async (token: string): Promise<WorkExperiencesResponse> => {
  const response = await axiosInstance.get('/work-experiences', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * 業務実績詳細を取得
 */
export const getWorkExperience = async (id: number, token: string): Promise<WorkExperienceResponse> => {
  const response = await axiosInstance.get(`/work-experiences/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * ユーザープロフィールを取得
 */
export const getUserProfile = async (token: string): Promise<UserProfileResponse> => {
  const response = await axiosInstance.get('/users/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * ユーザープロフィールを更新
 */
export interface UpdateUserProfileData {
  age?: number | null;
  address?: string;
  education?: string;
  major?: string;
  certifications?: string;
  remarks?: string;
}

export const updateUserProfile = async (
  data: UpdateUserProfileData,
  token: string
): Promise<UserProfileResponse> => {
  const response = await axiosInstance.put('/users/profile', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

/**
 * 業務実績を作成
 */
export interface CreateWorkExperienceData {
  start_date: string;
  end_date: string | null;
  industry?: string;
  system_name?: string;
  requirement_analysis?: number;
  basic_design?: number;
  detail_design?: number;
  development?: number;
  testing?: number;
  operation?: number;
  environment?: string;
  languages?: string;
}

export const createWorkExperience = async (
  data: CreateWorkExperienceData,
  token: string
): Promise<WorkExperienceResponse> => {
  const response = await axiosInstance.post('/work-experiences', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

/**
 * 業務実績を更新
 */
export const updateWorkExperience = async (
  id: number,
  data: CreateWorkExperienceData,
  token: string
): Promise<WorkExperienceResponse> => {
  const response = await axiosInstance.put(`/work-experiences/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

/**
 * 業務実績を削除
 */
export const deleteWorkExperience = async (id: number, token: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/work-experiences/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * プロフィール更新用のデータ型
 */
export interface UpdateUserProfileData {
  initials?: string;
  gender?: number;
  birthdate?: string | null;
  age?: number | null;
  address?: string;
  education?: string;
  major?: string;
  certifications?: string;
  remarks?: string;
}
