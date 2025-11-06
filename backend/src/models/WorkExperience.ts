export interface WorkExperience {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string | null;
  industry: string | null; // Deprecated: kept for backward compatibility
  industry_id: number | null; // New: industry master ID
  customer_name: string | null;
  system_name: string | null;
  requirement_analysis: number;
  basic_design: number;
  detail_design: number;
  development: number;
  testing: number;
  operation: number;
  environment: string | null;
  languages: string | null;
  created_at: string;
  updated_at: string;
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
