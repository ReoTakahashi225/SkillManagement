import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbGet, dbAll, dbRun } from '../database/db';
import { WorkExperience } from '../models/WorkExperience';
import { validateWorkExperienceData, WorkExperienceCreateData } from '../utils/validation';

/**
 * GET /api/work-experiences
 * ログイン中のユーザーの業務実績を全て取得
 */
export const getWorkExperiences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const workExperiences = await dbAll<WorkExperience>(
      'SELECT * FROM work_experiences WHERE user_id = ? ORDER BY start_date ASC',
      [req.user.userId]
    );

    // Fetch environment and language IDs for each work experience
    const enrichedWorkExperiences = await Promise.all(
      workExperiences.map(async (we) => {
        const environmentIds = await dbAll<{ environment_id: number }>(
          'SELECT environment_id FROM work_experience_environments WHERE work_experience_id = ?',
          [we.id]
        );
        const languageIds = await dbAll<{ language_id: number }>(
          'SELECT language_id FROM work_experience_languages WHERE work_experience_id = ?',
          [we.id]
        );

        return {
          ...we,
          environment_ids: environmentIds.map(e => e.environment_id),
          language_ids: languageIds.map(l => l.language_id),
        };
      })
    );

    res.json({ workExperiences: enrichedWorkExperiences });
  } catch (error) {
    console.error('Error fetching work experiences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/work-experiences/:id
 * 特定の業務実績の詳細を取得
 */
export const getWorkExperienceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: 'Invalid work experience ID' });
      return;
    }

    const workExperience = await dbGet<WorkExperience>(
      'SELECT * FROM work_experiences WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (!workExperience) {
      res.status(404).json({ error: 'Work experience not found' });
      return;
    }

    // Fetch environment and language IDs
    const environmentIds = await dbAll<{ environment_id: number }>(
      'SELECT environment_id FROM work_experience_environments WHERE work_experience_id = ?',
      [id]
    );
    const languageIds = await dbAll<{ language_id: number }>(
      'SELECT language_id FROM work_experience_languages WHERE work_experience_id = ?',
      [id]
    );

    const enrichedWorkExperience = {
      ...workExperience,
      environment_ids: environmentIds.map(e => e.environment_id),
      language_ids: languageIds.map(l => l.language_id),
    };

    res.json({ workExperience: enrichedWorkExperience });
  } catch (error) {
    console.error('Error fetching work experience:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/work-experiences
 * 新規業務実績を登録
 */
export const createWorkExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const data: WorkExperienceCreateData = req.body;

    // バリデーション
    const validation = validateWorkExperienceData(data);
    if (!validation.valid) {
      res.status(400).json({ error: 'Validation failed', details: validation.errors });
      return;
    }

    // デフォルト値の設定
    const workExperienceData = {
      user_id: req.user.userId,
      start_date: data.start_date,
      end_date: data.end_date || null,
      industry: data.industry || null,
      industry_id: data.industry_id || null,
      customer_name: data.customer_name || null,
      system_name: data.system_name || null,
      requirement_analysis: data.requirement_analysis ?? 0,
      basic_design: data.basic_design ?? 0,
      detail_design: data.detail_design ?? 0,
      development: data.development ?? 0,
      testing: data.testing ?? 0,
      operation: data.operation ?? 0,
      environment: data.environment || null,
      languages: data.languages || null,
    };

    // データベースに挿入
    const result = await dbRun(
      `INSERT INTO work_experiences (
        user_id, start_date, end_date, industry, industry_id, customer_name, system_name,
        requirement_analysis, basic_design, detail_design,
        development, testing, operation, environment, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workExperienceData.user_id,
        workExperienceData.start_date,
        workExperienceData.end_date,
        workExperienceData.industry,
        workExperienceData.industry_id,
        workExperienceData.customer_name,
        workExperienceData.system_name,
        workExperienceData.requirement_analysis,
        workExperienceData.basic_design,
        workExperienceData.detail_design,
        workExperienceData.development,
        workExperienceData.testing,
        workExperienceData.operation,
        workExperienceData.environment,
        workExperienceData.languages,
      ]
    );

    const workExperienceId = result.lastID;

    // Insert environment IDs into junction table
    if (data.environment_ids && Array.isArray(data.environment_ids)) {
      for (const envId of data.environment_ids) {
        await dbRun(
          'INSERT INTO work_experience_environments (work_experience_id, environment_id) VALUES (?, ?)',
          [workExperienceId, envId]
        );
      }
    }

    // Insert language IDs into junction table
    if (data.language_ids && Array.isArray(data.language_ids)) {
      for (const langId of data.language_ids) {
        await dbRun(
          'INSERT INTO work_experience_languages (work_experience_id, language_id) VALUES (?, ?)',
          [workExperienceId, langId]
        );
      }
    }

    // 作成したデータを取得
    const workExperience = await dbGet<WorkExperience>(
      'SELECT * FROM work_experiences WHERE id = ?',
      [workExperienceId]
    );

    // Fetch environment and language IDs
    const environmentIds = await dbAll<{ environment_id: number }>(
      'SELECT environment_id FROM work_experience_environments WHERE work_experience_id = ?',
      [workExperienceId]
    );
    const languageIds = await dbAll<{ language_id: number }>(
      'SELECT language_id FROM work_experience_languages WHERE work_experience_id = ?',
      [workExperienceId]
    );

    const enrichedWorkExperience = {
      ...workExperience,
      environment_ids: environmentIds.map(e => e.environment_id),
      language_ids: languageIds.map(l => l.language_id),
    };

    res.status(201).json({ workExperience: enrichedWorkExperience });
  } catch (error) {
    console.error('Error creating work experience:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/work-experiences/:id
 * 業務実績を更新
 */
export const updateWorkExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: 'Invalid work experience ID' });
      return;
    }

    // 既存データの確認（自分のデータかチェック）
    const existingWorkExperience = await dbGet<WorkExperience>(
      'SELECT * FROM work_experiences WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (!existingWorkExperience) {
      res.status(404).json({ error: 'Work experience not found' });
      return;
    }

    const data: WorkExperienceCreateData = req.body;

    // バリデーション
    const validation = validateWorkExperienceData(data);
    if (!validation.valid) {
      res.status(400).json({ error: 'Validation failed', details: validation.errors });
      return;
    }

    // データベースを更新
    await dbRun(
      `UPDATE work_experiences SET
        start_date = ?,
        end_date = ?,
        industry = ?,
        industry_id = ?,
        customer_name = ?,
        system_name = ?,
        requirement_analysis = ?,
        basic_design = ?,
        detail_design = ?,
        development = ?,
        testing = ?,
        operation = ?,
        environment = ?,
        languages = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?`,
      [
        data.start_date,
        data.end_date || null,
        data.industry || null,
        data.industry_id || null,
        data.customer_name || null,
        data.system_name || null,
        data.requirement_analysis ?? 0,
        data.basic_design ?? 0,
        data.detail_design ?? 0,
        data.development ?? 0,
        data.testing ?? 0,
        data.operation ?? 0,
        data.environment || null,
        data.languages || null,
        id,
        req.user.userId,
      ]
    );

    // Update environment IDs in junction table
    // First, delete existing environment links
    await dbRun(
      'DELETE FROM work_experience_environments WHERE work_experience_id = ?',
      [id]
    );
    // Then insert new environment links
    if (data.environment_ids && Array.isArray(data.environment_ids)) {
      for (const envId of data.environment_ids) {
        await dbRun(
          'INSERT INTO work_experience_environments (work_experience_id, environment_id) VALUES (?, ?)',
          [id, envId]
        );
      }
    }

    // Update language IDs in junction table
    // First, delete existing language links
    await dbRun(
      'DELETE FROM work_experience_languages WHERE work_experience_id = ?',
      [id]
    );
    // Then insert new language links
    if (data.language_ids && Array.isArray(data.language_ids)) {
      for (const langId of data.language_ids) {
        await dbRun(
          'INSERT INTO work_experience_languages (work_experience_id, language_id) VALUES (?, ?)',
          [id, langId]
        );
      }
    }

    // 更新後のデータを取得
    const workExperience = await dbGet<WorkExperience>(
      'SELECT * FROM work_experiences WHERE id = ?',
      [id]
    );

    // Fetch environment and language IDs
    const environmentIds = await dbAll<{ environment_id: number }>(
      'SELECT environment_id FROM work_experience_environments WHERE work_experience_id = ?',
      [id]
    );
    const languageIds = await dbAll<{ language_id: number }>(
      'SELECT language_id FROM work_experience_languages WHERE work_experience_id = ?',
      [id]
    );

    const enrichedWorkExperience = {
      ...workExperience,
      environment_ids: environmentIds.map(e => e.environment_id),
      language_ids: languageIds.map(l => l.language_id),
    };

    res.json({ workExperience: enrichedWorkExperience });
  } catch (error) {
    console.error('Error updating work experience:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/work-experiences/:id
 * 業務実績を削除
 */
export const deleteWorkExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: 'Invalid work experience ID' });
      return;
    }

    // 既存データの確認（自分のデータかチェック）
    const existingWorkExperience = await dbGet<WorkExperience>(
      'SELECT * FROM work_experiences WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (!existingWorkExperience) {
      res.status(404).json({ error: 'Work experience not found' });
      return;
    }

    // データベースから削除
    await dbRun(
      'DELETE FROM work_experiences WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    res.json({ message: '削除しました' });
  } catch (error) {
    console.error('Error deleting work experience:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
