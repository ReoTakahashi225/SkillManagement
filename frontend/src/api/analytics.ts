import axiosInstance from './axiosConfig';
import type { AnalyticsResponse } from '../types';

export const getAnalytics = async (token: string): Promise<AnalyticsResponse> => {
  const response = await axiosInstance.get('/analytics', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getAnalyticsForUser = async (userId: number, token: string): Promise<AnalyticsResponse> => {
  const response = await axiosInstance.get(`/analytics/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
