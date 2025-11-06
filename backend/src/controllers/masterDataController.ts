import { Request, Response } from 'express';
import { dbAll } from '../database/db';

interface MasterEnvironment {
  id: number;
  name: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

interface MasterLanguage {
  id: number;
  name: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

interface MasterIndustry {
  id: number;
  name: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

/**
 * Get all active environments
 */
export const getAllEnvironments = async (req: Request, res: Response): Promise<void> => {
  try {
    const environments = await dbAll<MasterEnvironment>(
      'SELECT id, name, category, display_order, is_active FROM master_environments WHERE is_active = 1 ORDER BY display_order, name'
    );

    res.json({ environments });
  } catch (error) {
    console.error('Get environments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all active programming languages
 */
export const getAllLanguages = async (req: Request, res: Response): Promise<void> => {
  try {
    const languages = await dbAll<MasterLanguage>(
      'SELECT id, name, category, display_order, is_active FROM master_languages WHERE is_active = 1 ORDER BY display_order, name'
    );

    res.json({ languages });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all active industries
 */
export const getAllIndustries = async (req: Request, res: Response): Promise<void> => {
  try {
    const industries = await dbAll<MasterIndustry>(
      'SELECT id, name, category, display_order, is_active FROM master_industries WHERE is_active = 1 ORDER BY display_order, name'
    );

    res.json({ industries });
  } catch (error) {
    console.error('Get industries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
