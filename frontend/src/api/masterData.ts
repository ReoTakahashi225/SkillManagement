import axiosInstance from './axiosConfig';
import type { MasterEnvironmentsResponse, MasterLanguagesResponse, MasterIndustriesResponse } from '../types';

/**
 * Get all environments
 */
export const getAllEnvironments = async (token: string): Promise<MasterEnvironmentsResponse> => {
  const response = await axiosInstance.get('/master/environments', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get all languages
 */
export const getAllLanguages = async (token: string): Promise<MasterLanguagesResponse> => {
  const response = await axiosInstance.get('/master/languages', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get all industries
 */
export const getAllIndustries = async (token: string): Promise<MasterIndustriesResponse> => {
  const response = await axiosInstance.get('/master/industries', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get all master data (languages, environments, industries)
 */
export const getMasterData = async (token: string) => {
  const [languagesRes, environmentsRes, industriesRes] = await Promise.all([
    getAllLanguages(token),
    getAllEnvironments(token),
    getAllIndustries(token),
  ]);

  return {
    languages: languagesRes.languages,
    environments: environmentsRes.environments,
    industries: industriesRes.industries,
  };
};
