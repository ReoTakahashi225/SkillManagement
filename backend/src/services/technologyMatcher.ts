import { dbAll } from '../database/db';

interface MasterEnvironment {
  id: number;
  name: string;
}

interface MasterLanguage {
  id: number;
  name: string;
}

/**
 * Match technology names to master data IDs
 */
export const matchTechnologies = async (
  description: string
): Promise<{ environmentIds: number[]; languageIds: number[] }> => {
  try {
    // Fetch all master data
    const environments = await dbAll<MasterEnvironment>('SELECT id, name FROM master_environments');
    const languages = await dbAll<MasterLanguage>('SELECT id, name FROM master_languages');

    const environmentIds: number[] = [];
    const languageIds: number[] = [];

    // Normalize description for matching (lowercase)
    const descLower = description.toLowerCase();

    // Match environments
    for (const env of environments) {
      const nameLower = env.name.toLowerCase();
      // Check if environment name appears in description
      if (descLower.includes(nameLower)) {
        environmentIds.push(env.id);
      }
    }

    // Match languages
    for (const lang of languages) {
      const nameLower = lang.name.toLowerCase();
      // Check if language name appears in description
      if (descLower.includes(nameLower)) {
        languageIds.push(lang.id);
      }
    }

    console.log(`[Technology Matcher] Matched ${environmentIds.length} environments, ${languageIds.length} languages`);

    return { environmentIds, languageIds };
  } catch (error) {
    console.error('[Technology Matcher] Error:', error);
    return { environmentIds: [], languageIds: [] };
  }
};

/**
 * Enhanced matching with common aliases and variations
 */
export const matchTechnologiesEnhanced = async (
  description: string
): Promise<{ environmentIds: number[]; languageIds: number[] }> => {
  try {
    // Fetch all master data
    const environments = await dbAll<MasterEnvironment>('SELECT id, name FROM master_environments');
    const languages = await dbAll<MasterLanguage>('SELECT id, name FROM master_languages');

    const environmentIds = new Set<number>();
    const languageIds = new Set<number>();

    // Normalize description
    const descLower = description.toLowerCase();

    // Common aliases for matching
    const environmentAliases: { [key: string]: string[] } = {
      'windows': ['windows', 'win', 'windows server', 'ウィンドウズ', 'ウインドウズ'],
      'linux': ['linux', 'unix', 'ubuntu', 'centos', 'redhat', 'リナックス'],
      'メインフレーム': ['メインフレーム', 'mainframe', 'mf', 'ホスト'],
      'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
      'azure': ['azure', 'microsoft azure'],
      'gcp': ['gcp', 'google cloud', 'google cloud platform'],
      'as400': ['as400', 'as/400', 'ibm i', 'iseries'],
      'docker': ['docker', 'container', 'コンテナ'],
      'kubernetes': ['kubernetes', 'k8s'],
    };

    const languageAliases: { [key: string]: string[] } = {
      'java': ['java', 'jdk', 'spring', 'springboot'],
      'javascript': ['javascript', 'js', 'node.js', 'nodejs', 'react', 'vue', 'angular'],
      'typescript': ['typescript', 'ts'],
      'python': ['python', 'py', 'django', 'flask', 'パイソン'],
      'c#': ['c#', 'csharp', 'c♯', '.net', 'dotnet'],
      'c++': ['c++', 'cpp'],
      'php': ['php'],
      'ruby': ['ruby', 'rails', 'ruby on rails'],
      'go': ['go', 'golang'],
      'swift': ['swift', 'ios'],
      'kotlin': ['kotlin', 'android'],
      'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'sqlserver'],
      'cobol': ['cobol', 'コボル'],
      'rpg': ['rpg', 'rpgle'],
      'jcl': ['jcl'],
      'cl': ['cl', 'control language'],
      'shell': ['shell', 'bash', 'sh', 'シェル'],
    };

    // Match environments with aliases
    for (const env of environments) {
      const nameLower = env.name.toLowerCase();
      const aliases = environmentAliases[nameLower] || [nameLower];

      for (const alias of aliases) {
        if (descLower.includes(alias)) {
          environmentIds.add(env.id);
          break;
        }
      }
    }

    // Match languages with aliases
    for (const lang of languages) {
      const nameLower = lang.name.toLowerCase();
      const aliases = languageAliases[nameLower] || [nameLower];

      for (const alias of aliases) {
        // Use word boundary matching for better accuracy
        const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(descLower)) {
          languageIds.add(lang.id);
          break;
        }
      }
    }

    const envArray = Array.from(environmentIds);
    const langArray = Array.from(languageIds);

    console.log(`[Technology Matcher Enhanced] Matched ${envArray.length} environments, ${langArray.length} languages`);
    console.log(`[Technology Matcher Enhanced] Environments: ${envArray.join(', ')}`);
    console.log(`[Technology Matcher Enhanced] Languages: ${langArray.join(', ')}`);

    return { environmentIds: envArray, languageIds: langArray };
  } catch (error) {
    console.error('[Technology Matcher Enhanced] Error:', error);
    return { environmentIds: [], languageIds: [] };
  }
};
