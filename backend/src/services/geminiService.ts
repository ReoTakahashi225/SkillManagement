import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';

// Ensure dotenv is loaded
dotenv.config();

// Check if API key is loaded
if (!process.env.GEMINI_API_KEY) {
  console.error('[Gemini Service] WARNING: GEMINI_API_KEY is not set in environment variables');
} else {
  console.log('[Gemini Service] API Key loaded (length:', process.env.GEMINI_API_KEY.length, 'characters)');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Prompt template for extracting work experience data
const EXTRACTION_PROMPT = `
添付したPDF/Excelファイルは、エンジニアの業務経歴書です。これを解析して、業務実績データをJSON形式で抽出してください。

【解析の手順】
1. ファイル内の各プロジェクト/案件を特定する
2. 各プロジェクトについて、以下の情報を抽出する：
   - 期間（開始年月と終了年月）
   - 業種/業界（金融、製造、流通、通信、官公庁など）
   - お客様名/顧客名
   - プロジェクト名/システム名
   - チーム規模/人数
   - 担当した役割（開発者、リーダー、PMなど）
   - 担当した工程（要件定義、基本設計、詳細設計、開発、テスト、運用）
   - 使用した技術/言語/環境
   - 業務内容の詳細

【日付の抽出ルール】
- "2023年4月～2024年3月" → start_date: "2023-04", end_date: "2024-03"
- "2023/4～2024/3" → start_date: "2023-04", end_date: "2024-03"
- "2023.04-2024.03" → start_date: "2023-04", end_date: "2024-03"
- "2023年4月～現在" → start_date: "2023-04", end_date: null
- "2023年4月～" → start_date: "2023-04", end_date: null

【工程の判定ルール】
以下のようなキーワードがあればtrueとしてください：
- 要件定義: "要件定義"、"要求定義"、"RD"
- 基本設計: "基本設計"、"外部設計"、"BD"
- 詳細設計: "詳細設計"、"内部設計"、"DD"
- 開発: "開発"、"実装"、"製造"、"コーディング"、"PG"
- テスト: "テスト"、"試験"、"UT"、"IT"、"ST"
- 運用: "運用"、"保守"、"維持管理"

【技術情報の処理】
- 現時点では、environment_idsとlanguage_idsは空配列[]としてください
- 使用技術は、description欄に含めてください

【出力フォーマット】
JSONのみを出力してください。説明文やマークダウンのコードブロック記号は不要です。

以下の形式で出力：
[
  {
    "start_date": "YYYY-MM",
    "end_date": "YYYY-MM" or null,
    "industry": "業種名" or null,
    "industry_id": null,
    "customer_name": "顧客名" or null,
    "system_name": "システム名" or null,
    "team_size": 数値 or null,
    "role": "役割" or null,
    "requirement_analysis": true or false,
    "basic_design": true or false,
    "detail_design": true or false,
    "development": true or false,
    "testing": true or false,
    "operation": true or false,
    "environment_ids": [],
    "language_ids": [],
    "description": "詳細な業務内容の説明"
  }
]

必ずJSON配列形式で出力してください。コードブロックで囲まないでください。
`;

interface WorkExperienceData {
  start_date: string;
  end_date: string | null;
  industry: string | null;
  industry_id: number | null;
  customer_name: string | null;
  system_name: string | null;
  team_size: number | null;
  role: string | null;
  requirement_analysis: boolean;
  basic_design: boolean;
  detail_design: boolean;
  development: boolean;
  testing: boolean;
  operation: boolean;
  environment_ids: number[];
  language_ids: number[];
  description: string | null;
}

/**
 * Convert Excel file to text representation
 */
const convertExcelToText = (filePath: string): string => {
  const workbook = XLSX.readFile(filePath);
  let textContent = '';

  // Process each sheet
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    textContent += `\n=== シート: ${sheetName} ===\n`;

    // Convert sheet to CSV format (more readable for AI)
    const csv = XLSX.utils.sheet_to_csv(sheet);
    textContent += csv + '\n';
  });

  return textContent;
};

/**
 * Check if the file is an Excel file
 */
const isExcelFile = (mimeType: string): boolean => {
  return mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
         mimeType === 'application/vnd.ms-excel';
};

/**
 * Extract work experience data from a file using Gemini API
 */
export const extractWorkExperienceFromFile = async (
  filePath: string,
  mimeType: string
): Promise<WorkExperienceData[]> => {
  try {
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let result;

    if (isExcelFile(mimeType)) {
      // For Excel files, convert to text and send as text
      console.log('[Gemini Service] Converting Excel file to text...');
      const textContent = convertExcelToText(filePath);
      console.log('[Gemini Service] Excel converted to text (length:', textContent.length, 'chars)');

      // Generate content with text
      result = await model.generateContent([
        EXTRACTION_PROMPT,
        '\n\n以下がExcelファイルの内容です:\n',
        textContent
      ]);
    } else {
      // For PDF files, send as base64
      console.log('[Gemini Service] Processing PDF file...');
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      const filePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };

      // Generate content
      result = await model.generateContent([EXTRACTION_PROMPT, filePart]);
    }

    const response = await result.response;
    const text = response.text();

    console.log('[Gemini Service] Raw response:', text);

    // Clean up response - remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse JSON
    const workExperiences = JSON.parse(jsonText);

    // Validate that it's an array
    if (!Array.isArray(workExperiences)) {
      throw new Error('Gemini response is not an array');
    }

    // Validate required fields
    for (const we of workExperiences) {
      if (!we.start_date) {
        throw new Error('Missing required field: start_date');
      }
    }

    console.log(`[Gemini Service] Successfully extracted ${workExperiences.length} work experiences`);

    return workExperiences;
  } catch (error) {
    console.error('[Gemini Service] Error:', error);
    throw error;
  }
};

/**
 * Get supported file mime types
 */
export const getSupportedMimeTypes = (): string[] => {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];
};

/**
 * Check if file type is supported
 */
export const isSupportedFileType = (mimeType: string): boolean => {
  return getSupportedMimeTypes().includes(mimeType);
};
