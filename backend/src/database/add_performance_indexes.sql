-- Performance Indexes for Skill Management System
-- These indexes significantly improve query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Work experiences indexes
CREATE INDEX IF NOT EXISTS idx_work_experiences_user_id ON work_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_work_experiences_start_date ON work_experiences(start_date);
CREATE INDEX IF NOT EXISTS idx_work_experiences_end_date ON work_experiences(end_date);
CREATE INDEX IF NOT EXISTS idx_work_experiences_industry_id ON work_experiences(industry_id);

-- Work experience languages junction table
CREATE INDEX IF NOT EXISTS idx_we_languages_work_exp ON work_experience_languages(work_experience_id);
CREATE INDEX IF NOT EXISTS idx_we_languages_language ON work_experience_languages(language_id);

-- Work experience environments junction table
CREATE INDEX IF NOT EXISTS idx_we_environments_work_exp ON work_experience_environments(work_experience_id);
CREATE INDEX IF NOT EXISTS idx_we_environments_environment ON work_experience_environments(environment_id);

-- User profiles table (index already exists as idx_user_profiles_user_id in schema.sql)
-- No additional indexes needed for user_profiles table

-- Master tables indexes
CREATE INDEX IF NOT EXISTS idx_master_languages_name ON master_languages(name);
CREATE INDEX IF NOT EXISTS idx_master_languages_category ON master_languages(category);
CREATE INDEX IF NOT EXISTS idx_master_environments_name ON master_environments(name);
CREATE INDEX IF NOT EXISTS idx_master_environments_category ON master_environments(category);
CREATE INDEX IF NOT EXISTS idx_master_industries_name ON master_industries(name);
CREATE INDEX IF NOT EXISTS idx_master_industries_category ON master_industries(category);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_work_exp_user_dates ON work_experiences(user_id, start_date DESC, end_date DESC);

-- Analyze database for query optimization
ANALYZE;
