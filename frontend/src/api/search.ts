import axiosInstance from './axiosConfig';

// Search API types and functions
export interface SearchCriteria {
  languages?: number[];
  environments?: number[];
  industries?: number[];
  certifications?: string;
}

export interface SearchResult {
  id: number;
  username: string;
  full_name: string | null;
  birthdate: string | null;
  age: number | null;
  certifications: string | null;
  work_experiences: any[];
}

export interface SearchResponse {
  users: SearchResult[];
}

export const searchUsers = async (
  criteria: SearchCriteria,
  token: string
): Promise<SearchResponse> => {
  const response = await axiosInstance.post('/admin/search', criteria, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
