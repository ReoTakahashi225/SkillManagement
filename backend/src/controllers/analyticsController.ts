import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbAll } from '../database/db';
import { WorkExperience } from '../models/WorkExperience';

interface IndustryExperience {
  industry: string;
  months: number;
}

interface TechnologyCount {
  name: string;
  count: number;
  category: string;
}

interface TaskBreakdown {
  task: string;
  count: number;
}

interface AnalyticsData {
  industryExperience: IndustryExperience[];
  technologies: {
    environments: TechnologyCount[];
    languages: TechnologyCount[];
  };
  taskBreakdown: TaskBreakdown[];
  timeline: WorkExperience[];
}

/**
 * Calculate months between two dates (YYYY-MM format)
 */
const calculateMonths = (startDate: string, endDate: string | null): number => {
  const [startYear, startMonth] = startDate.split('-').map(Number);
  const end = endDate || new Date().toISOString().slice(0, 7);
  const [endYear, endMonth] = end.split('-').map(Number);

  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
};

/**
 * Helper function to generate analytics data for a specific user
 */
const generateAnalyticsForUser = async (userId: number): Promise<AnalyticsData> => {
  // Fetch all work experiences for the user
  const workExperiences = await dbAll<WorkExperience>(
    'SELECT * FROM work_experiences WHERE user_id = ? ORDER BY start_date ASC',
    [userId]
  );

    // 1. Industry experience (months by industry)
    const industryMap = new Map<string, number>();
    workExperiences.forEach((we) => {
      const industry = we.industry || '未分類';
      const months = calculateMonths(we.start_date, we.end_date);
      industryMap.set(industry, (industryMap.get(industry) || 0) + months);
    });

    const industryExperience: IndustryExperience[] = Array.from(industryMap.entries()).map(
      ([industry, months]) => ({ industry, months })
    );

    // 2. Technology usage (environments and languages)
    const environmentMap = new Map<string, { count: number; category: string }>();
    const languageMap = new Map<string, { count: number; category: string }>();

    for (const we of workExperiences) {
      // Fetch environments for this work experience
      const environments = await dbAll<{ environment_id: number }>(
        'SELECT environment_id FROM work_experience_environments WHERE work_experience_id = ?',
        [we.id]
      );

      for (const env of environments) {
        const envData = await dbAll<{ name: string; category: string | null }>(
          'SELECT name, category FROM master_environments WHERE id = ?',
          [env.environment_id]
        );
        if (envData.length > 0) {
          const { name, category } = envData[0];
          const existing = environmentMap.get(name);
          environmentMap.set(name, {
            count: (existing?.count || 0) + 1,
            category: category || 'その他',
          });
        }
      }

      // Fetch languages for this work experience
      const languages = await dbAll<{ language_id: number }>(
        'SELECT language_id FROM work_experience_languages WHERE work_experience_id = ?',
        [we.id]
      );

      for (const lang of languages) {
        const langData = await dbAll<{ name: string; category: string | null }>(
          'SELECT name, category FROM master_languages WHERE id = ?',
          [lang.language_id]
        );
        if (langData.length > 0) {
          const { name, category } = langData[0];
          const existing = languageMap.get(name);
          languageMap.set(name, {
            count: (existing?.count || 0) + 1,
            category: category || 'その他',
          });
        }
      }
    }

    const environments: TechnologyCount[] = Array.from(environmentMap.entries()).map(
      ([name, data]) => ({ name, count: data.count, category: data.category })
    );

    const languages: TechnologyCount[] = Array.from(languageMap.entries()).map(
      ([name, data]) => ({ name, count: data.count, category: data.category })
    );

    // 3. Task breakdown (count of each task type)
    const taskBreakdown: TaskBreakdown[] = [
      {
        task: '要件定義',
        count: workExperiences.filter((we) => we.requirement_analysis === 1).length,
      },
      {
        task: '基本設計',
        count: workExperiences.filter((we) => we.basic_design === 1).length,
      },
      {
        task: '詳細設計',
        count: workExperiences.filter((we) => we.detail_design === 1).length,
      },
      {
        task: '開発',
        count: workExperiences.filter((we) => we.development === 1).length,
      },
      {
        task: 'テスト',
        count: workExperiences.filter((we) => we.testing === 1).length,
      },
      {
        task: '運用',
        count: workExperiences.filter((we) => we.operation === 1).length,
      },
    ].filter((item) => item.count > 0);

    // 4. Timeline (all work experiences with enriched data)
    const timeline = await Promise.all(
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
          environment_ids: environmentIds.map((e) => e.environment_id),
          language_ids: languageIds.map((l) => l.language_id),
        };
      })
    );

  const analyticsData: AnalyticsData = {
    industryExperience,
    technologies: {
      environments,
      languages,
    },
    taskBreakdown,
    timeline,
  };

  return analyticsData;
};

/**
 * GET /api/analytics
 * Get analytics data for the logged-in user
 */
export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const analyticsData = await generateAnalyticsForUser(req.user.userId);
    res.json({ analytics: analyticsData });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/analytics/user/:userId
 * Get analytics data for a specific user (admin only)
 */
export const getAnalyticsForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user is admin
    const currentUser = await dbAll<{ role: string }>(
      'SELECT role FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      res.status(403).json({ error: 'Admin privileges required' });
      return;
    }

    const targetUserId = parseInt(req.params.userId);
    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Check if target user exists
    const targetUser = await dbAll<{ id: number }>(
      'SELECT id FROM users WHERE id = ?',
      [targetUserId]
    );

    if (targetUser.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const analyticsData = await generateAnalyticsForUser(targetUserId);
    res.json({ analytics: analyticsData });
  } catch (error) {
    console.error('Error fetching analytics for user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
