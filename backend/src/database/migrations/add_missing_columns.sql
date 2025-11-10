-- Migration: Add missing columns to work_experiences and user_profiles tables
-- Date: 2025-11-06

-- Add missing columns to work_experiences table
ALTER TABLE work_experiences ADD COLUMN industry_id INTEGER;
ALTER TABLE work_experiences ADD COLUMN customer_name TEXT;
ALTER TABLE work_experiences ADD COLUMN team_size INTEGER;
ALTER TABLE work_experiences ADD COLUMN role TEXT;
ALTER TABLE work_experiences ADD COLUMN description TEXT;

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles ADD COLUMN initials TEXT;
ALTER TABLE user_profiles ADD COLUMN gender INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN birthdate TEXT;
ALTER TABLE user_profiles ADD COLUMN remarks TEXT;
