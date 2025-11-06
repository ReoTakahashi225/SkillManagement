-- Master table for environments
CREATE TABLE IF NOT EXISTS master_environments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT, -- 'cloud', 'on-premise', 'container', 'ci-cd', 'database', 'other'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Master table for programming languages
CREATE TABLE IF NOT EXISTS master_languages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT, -- 'backend', 'frontend', 'mobile', 'database', 'script', 'other'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for work_experiences and environments
CREATE TABLE IF NOT EXISTS work_experience_environments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_experience_id INTEGER NOT NULL,
  environment_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_experience_id) REFERENCES work_experiences(id) ON DELETE CASCADE,
  FOREIGN KEY (environment_id) REFERENCES master_environments(id) ON DELETE CASCADE,
  UNIQUE(work_experience_id, environment_id)
);

-- Junction table for work_experiences and languages
CREATE TABLE IF NOT EXISTS work_experience_languages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_experience_id INTEGER NOT NULL,
  language_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_experience_id) REFERENCES work_experiences(id) ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES master_languages(id) ON DELETE CASCADE,
  UNIQUE(work_experience_id, language_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_we_env_work_exp ON work_experience_environments(work_experience_id);
CREATE INDEX IF NOT EXISTS idx_we_env_env ON work_experience_environments(environment_id);
CREATE INDEX IF NOT EXISTS idx_we_lang_work_exp ON work_experience_languages(work_experience_id);
CREATE INDEX IF NOT EXISTS idx_we_lang_lang ON work_experience_languages(language_id);
