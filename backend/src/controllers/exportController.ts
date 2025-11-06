import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbGet, dbAll } from '../database/db';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface User {
  id: number;
  username: string;
  email: string | null;
  full_name: string | null;
}

interface UserProfile {
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
}

interface PdfExportSettings {
  nameDisplay: 'fullName' | 'initials';
  ageFormat: 'exact' | 'decade';
}

interface WorkExperience {
  id: number;
  start_date: string;
  end_date: string | null;
  industry: string | null;
  industry_id: number | null;
  customer_name: string | null;
  system_name: string | null;
  requirement_analysis: number;
  basic_design: number;
  detail_design: number;
  development: number;
  testing: number;
  operation: number;
}

// Handlebars helper functions
handlebars.registerHelper('formatDate', (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  return `${year}/${month}`;
});

handlebars.registerHelper('joinArray', (arr: string[], separator: string) => {
  if (!arr || arr.length === 0) return '';
  return arr.join(separator);
});

handlebars.registerHelper('add', (a: number, b: number) => {
  return a + b;
});

handlebars.registerHelper('hasLength', (arr: any[]) => {
  return arr && arr.length > 0;
});

/**
 * Generate PDF skillsheet for the authenticated user
 */
export const generatePDF = async (req: AuthRequest, res: Response): Promise<void> => {
  let browser;

  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userId = req.user.userId;

    // Get PDF export settings from request body (defaults if not provided)
    const settings: PdfExportSettings = {
      nameDisplay: req.body.nameDisplay || 'initials',
      ageFormat: req.body.ageFormat || 'exact',
    };

    // Fetch user data
    const user = await dbGet<User>(
      'SELECT id, username, email, full_name FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Fetch user profile
    const profile = await dbGet<UserProfile>(
      'SELECT user_id, initials, gender, birthdate, age, address, education, major, certifications, remarks FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    // Fetch work experiences (ordered by start_date ASC)
    const workExperiences = await dbAll<WorkExperience>(
      'SELECT * FROM work_experiences WHERE user_id = ? ORDER BY start_date ASC',
      [userId]
    );

    // Enrich work experiences with master data
    const enrichedWorkExperiences = await Promise.all(
      workExperiences.map(async (we) => {
        // Get industry name
        let industryName = we.industry || '';
        if (we.industry_id) {
          const industry = await dbGet<{ name: string }>(
            'SELECT name FROM master_industries WHERE id = ?',
            [we.industry_id]
          );
          if (industry) {
            industryName = industry.name;
          }
        }

        // Get environment names
        const environmentIds = await dbAll<{ environment_id: number }>(
          'SELECT environment_id FROM work_experience_environments WHERE work_experience_id = ?',
          [we.id]
        );
        const environments: string[] = [];
        for (const envId of environmentIds) {
          const env = await dbGet<{ name: string }>(
            'SELECT name FROM master_environments WHERE id = ?',
            [envId.environment_id]
          );
          if (env) {
            environments.push(env.name);
          }
        }

        // Get language names
        const languageIds = await dbAll<{ language_id: number }>(
          'SELECT language_id FROM work_experience_languages WHERE work_experience_id = ?',
          [we.id]
        );
        const languages: string[] = [];
        for (const langId of languageIds) {
          const lang = await dbGet<{ name: string }>(
            'SELECT name FROM master_languages WHERE id = ?',
            [langId.language_id]
          );
          if (lang) {
            languages.push(lang.name);
          }
        }

        return {
          ...we,
          industryName,
          environments,
          languages,
        };
      })
    );

    // Calculate experience duration for each environment and language
    interface ExperienceDuration {
      name: string;
      months: number;
    }

    const environmentDurations = new Map<string, number>();
    const languageDurations = new Map<string, number>();

    enrichedWorkExperiences.forEach((we) => {
      // Calculate duration in months
      const startDate = new Date(we.start_date);
      const endDate = we.end_date ? new Date(we.end_date) : new Date();
      const months = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

      // Accumulate environment durations
      we.environments.forEach((env) => {
        environmentDurations.set(env, (environmentDurations.get(env) || 0) + months);
      });

      // Accumulate language durations
      we.languages.forEach((lang) => {
        languageDurations.set(lang, (languageDurations.get(lang) || 0) + months);
      });
    });

    // Sort by duration (descending) and extract names
    const sortedEnvironments = Array.from(environmentDurations.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    const sortedLanguages = Array.from(languageDurations.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    // Apply PDF export settings
    let displayName = user.full_name || user.username;
    if (settings.nameDisplay === 'initials' && profile?.initials) {
      displayName = profile.initials;
    }

    let displayAge = '';
    if (profile?.age !== null && profile?.age !== undefined) {
      if (settings.ageFormat === 'exact') {
        displayAge = `${profile.age}歳`;
      } else if (settings.ageFormat === 'decade') {
        const decade = Math.floor(profile.age / 10) * 10;
        displayAge = `${decade}代`;
      }
    }

    // Format gender display (0: blank, 1: 男, 2: 女)
    let displayGender = '';
    if (profile?.gender === 1) {
      displayGender = '男';
    } else if (profile?.gender === 2) {
      displayGender = '女';
    }

    // Prepare template data
    const today = new Date();
    const currentDate = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

    const templateData = {
      currentDate,
      user: {
        ...user,
        display_name: displayName,
      },
      profile: profile ? {
        ...profile,
        display_age: displayAge,
        display_gender: displayGender,
      } : {
        initials: null,
        gender: 0,
        birthdate: null,
        age: null,
        display_age: '',
        display_gender: '',
        address: '',
        education: '',
        major: '',
        certifications: '',
        remarks: '',
      },
      workExperiences: enrichedWorkExperiences,
      aggregatedEnvironments: sortedEnvironments.join('、'),
      aggregatedLanguages: sortedLanguages.join('、'),
    };

    // Load and compile Handlebars template
    const templatePath = path.join(__dirname, '../templates/skillsheet.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    const html = template(templateData);

    // Debug: Save HTML to file if DEBUG_PDF env variable is set
    if (process.env.DEBUG_PDF === 'true') {
      const debugHtmlPath = path.join(__dirname, '../../debug_skillsheet.html');
      fs.writeFileSync(debugHtmlPath, html, 'utf-8');
      console.log(`[DEBUG] HTML saved to: ${debugHtmlPath}`);
    }

    console.log(`[PDF Export] Generating PDF for user: ${user.full_name || user.username}`);
    console.log(`[PDF Export] Work experiences count: ${enrichedWorkExperiences.length}`);

    // Generate PDF with Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 1600 });

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    await browser.close();

    console.log(`[PDF Export] PDF generated successfully (${pdfBuffer.length} bytes)`);

    // Generate filename based on settings
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const fileName = `【スキルシート】${displayName}_${dateStr}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    // Send PDF buffer as binary
    res.end(pdfBuffer, 'binary');
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Close browser if still open
    if (browser) {
      await browser.close();
    }

    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

/**
 * Generate PDF skillsheet for any user (admin only)
 */
export const generatePDFForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  let browser;

  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user is admin
    const currentUser = await dbGet<{ role: string }>(
      'SELECT role FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!currentUser || currentUser.role !== 'admin') {
      res.status(403).json({ error: 'Admin privileges required' });
      return;
    }

    const targetUserId = parseInt(req.params.userId);
    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Get PDF export settings from request body (defaults if not provided)
    const settings: PdfExportSettings = {
      nameDisplay: req.body.nameDisplay || 'initials',
      ageFormat: req.body.ageFormat || 'exact',
    };

    // Fetch target user data
    const user = await dbGet<User>(
      'SELECT id, username, email, full_name FROM users WHERE id = ?',
      [targetUserId]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Fetch user profile
    const profile = await dbGet<UserProfile>(
      'SELECT user_id, initials, gender, birthdate, age, address, education, major, certifications, remarks FROM user_profiles WHERE user_id = ?',
      [targetUserId]
    );

    // Fetch work experiences (ordered by start_date ASC)
    const workExperiences = await dbAll<WorkExperience>(
      'SELECT * FROM work_experiences WHERE user_id = ? ORDER BY start_date ASC',
      [targetUserId]
    );

    // Enrich work experiences with master data
    const enrichedWorkExperiences = await Promise.all(
      workExperiences.map(async (we) => {
        // Get industry name
        let industryName = we.industry || '';
        if (we.industry_id) {
          const industry = await dbGet<{ name: string }>(
            'SELECT name FROM master_industries WHERE id = ?',
            [we.industry_id]
          );
          if (industry) {
            industryName = industry.name;
          }
        }

        // Get environment names
        const environmentIds = await dbAll<{ environment_id: number }>(
          'SELECT environment_id FROM work_experience_environments WHERE work_experience_id = ?',
          [we.id]
        );
        const environments: string[] = [];
        for (const envId of environmentIds) {
          const env = await dbGet<{ name: string }>(
            'SELECT name FROM master_environments WHERE id = ?',
            [envId.environment_id]
          );
          if (env) {
            environments.push(env.name);
          }
        }

        // Get language names
        const languageIds = await dbAll<{ language_id: number }>(
          'SELECT language_id FROM work_experience_languages WHERE work_experience_id = ?',
          [we.id]
        );
        const languages: string[] = [];
        for (const langId of languageIds) {
          const lang = await dbGet<{ name: string }>(
            'SELECT name FROM master_languages WHERE id = ?',
            [langId.language_id]
          );
          if (lang) {
            languages.push(lang.name);
          }
        }

        return {
          ...we,
          industryName,
          environments,
          languages,
        };
      })
    );

    // Calculate experience duration for each environment and language
    const environmentDurations = new Map<string, number>();
    const languageDurations = new Map<string, number>();

    enrichedWorkExperiences.forEach((we) => {
      const startDate = new Date(we.start_date);
      const endDate = we.end_date ? new Date(we.end_date) : new Date();
      const months = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

      we.environments.forEach((env) => {
        environmentDurations.set(env, (environmentDurations.get(env) || 0) + months);
      });

      we.languages.forEach((lang) => {
        languageDurations.set(lang, (languageDurations.get(lang) || 0) + months);
      });
    });

    const sortedEnvironments = Array.from(environmentDurations.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    const sortedLanguages = Array.from(languageDurations.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    // Apply PDF export settings
    let displayName = user.full_name || user.username;
    if (settings.nameDisplay === 'initials' && profile?.initials) {
      displayName = profile.initials;
    }

    let displayAge = '';
    if (profile?.age !== null && profile?.age !== undefined) {
      if (settings.ageFormat === 'exact') {
        displayAge = `${profile.age}歳`;
      } else if (settings.ageFormat === 'decade') {
        const decade = Math.floor(profile.age / 10) * 10;
        displayAge = `${decade}代`;
      }
    }

    let displayGender = '';
    if (profile?.gender === 1) {
      displayGender = '男';
    } else if (profile?.gender === 2) {
      displayGender = '女';
    }

    const today = new Date();
    const currentDate = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

    const templateData = {
      currentDate,
      user: {
        ...user,
        display_name: displayName,
      },
      profile: profile ? {
        ...profile,
        display_age: displayAge,
        display_gender: displayGender,
      } : {
        initials: null,
        gender: 0,
        birthdate: null,
        age: null,
        display_age: '',
        display_gender: '',
        address: '',
        education: '',
        major: '',
        certifications: '',
        remarks: '',
      },
      workExperiences: enrichedWorkExperiences,
      aggregatedEnvironments: sortedEnvironments.join('、'),
      aggregatedLanguages: sortedLanguages.join('、'),
    };

    // Load and compile Handlebars template
    const templatePath = path.join(__dirname, '../templates/skillsheet.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    const html = template(templateData);

    console.log(`[PDF Export] Admin generating PDF for user: ${user.full_name || user.username}`);

    // Generate PDF with Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    await browser.close();

    console.log(`[PDF Export] PDF generated successfully (${pdfBuffer.length} bytes)`);

    // Generate filename
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const fileName = `【スキルシート】${displayName}_${dateStr}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    res.end(pdfBuffer, 'binary');
  } catch (error) {
    console.error('Error generating PDF for user:', error);

    if (browser) {
      await browser.close();
    }

    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
