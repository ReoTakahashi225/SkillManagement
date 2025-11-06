export interface User {
  id: number;
  username: string;
  email: string | null;
  full_name: string | null;
  role?: 'user' | 'admin';
}

export interface WorkExperience {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string | null;
  industry: string | null; // Deprecated: kept for backward compatibility
  industry_id?: number | null; // New: industry master ID
  customer_name: string | null;
  system_name: string | null;
  requirement_analysis: number;
  basic_design: number;
  detail_design: number;
  development: number;
  testing: number;
  operation: number;
  environment: string | null; // Deprecated: kept for backward compatibility
  languages: string | null; // Deprecated: kept for backward compatibility
  environment_ids?: number[]; // New: array of selected environment IDs
  language_ids?: number[]; // New: array of selected language IDs
  created_at: string;
  updated_at: string;
}

// Master data types
export interface MasterEnvironment {
  id: number;
  name: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

export interface MasterLanguage {
  id: number;
  name: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

export interface MasterIndustry {
  id: number;
  name: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

export interface UserProfile {
  id: number;
  user_id: number;
  initials: string | null;
  gender: number; // 0: not set, 1: male, 2: female
  birthdate: string | null;
  age: number | null;
  address: string | null;
  education: string | null;
  major: string | null;
  certifications: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// PDF export settings
export interface PdfExportSettings {
  nameDisplay: 'fullName' | 'initials'; // デフォルト: 'initials'
  ageFormat: 'exact' | 'decade'; // デフォルト: 'exact' (35歳) or 'decade' (30代)
}

// APIレスポンス型
export interface WorkExperiencesResponse {
  workExperiences: WorkExperience[];
}

export interface WorkExperienceResponse {
  workExperience: WorkExperience;
}

export interface UserProfileResponse {
  profile: UserProfile;
}

// Admin API types
export interface UserListItem extends User {
  work_experience_count: number;
}

export interface UsersResponse {
  users: UserListItem[];
}

export interface UserDetailResponse {
  user: User & {
    profile: UserProfile | null;
    workExperiences: WorkExperience[];
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalWorkExperiences: number;
  usersWithProfiles: number;
}

export interface DashboardStatsResponse {
  stats: DashboardStats;
}

// Master data API responses
export interface MasterEnvironmentsResponse {
  environments: MasterEnvironment[];
}

export interface MasterLanguagesResponse {
  languages: MasterLanguage[];
}

export interface MasterIndustriesResponse {
  industries: MasterIndustry[];
}

// Analytics types
export interface IndustryExperience {
  industry: string;
  months: number;
}

export interface TechnologyCount {
  name: string;
  count: number;
  category: string;
}

export interface TaskBreakdown {
  task: string;
  count: number;
}

export interface AnalyticsData {
  industryExperience: IndustryExperience[];
  technologies: {
    environments: TechnologyCount[];
    languages: TechnologyCount[];
  };
  taskBreakdown: TaskBreakdown[];
  timeline: WorkExperience[];
}

export interface AnalyticsResponse {
  analytics: AnalyticsData;
}
