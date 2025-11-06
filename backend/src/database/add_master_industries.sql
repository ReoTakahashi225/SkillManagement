-- Create master_industries table
CREATE TABLE IF NOT EXISTS master_industries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add industry_id column to work_experiences table
ALTER TABLE work_experiences
ADD COLUMN industry_id INTEGER REFERENCES master_industries(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_work_experiences_industry_id ON work_experiences(industry_id);
