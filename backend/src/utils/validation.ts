/**
 * 日付フォーマット（YYYY-MM）のバリデーション
 */
export const isValidDateFormat = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(dateStr);
};

/**
 * 開始日が終了日以前かチェック
 */
export const isStartDateBeforeEndDate = (startDate: string, endDate: string | null): boolean => {
  if (!endDate) return true; // 終了日がnullの場合（現在進行中）は常にOK

  const [startYear, startMonth] = startDate.split('-').map(Number);
  const [endYear, endMonth] = endDate.split('-').map(Number);

  if (startYear < endYear) return true;
  if (startYear === endYear && startMonth <= endMonth) return true;

  return false;
};

/**
 * 業務実績作成時のバリデーション
 */
export interface WorkExperienceCreateData {
  start_date: string;
  end_date?: string | null;
  industry?: string | null; // Deprecated: kept for backward compatibility
  industry_id?: number | null; // New: industry master ID
  customer_name?: string | null;
  system_name?: string | null;
  requirement_analysis?: number;
  basic_design?: number;
  detail_design?: number;
  development?: number;
  testing?: number;
  operation?: number;
  environment?: string | null; // Deprecated: kept for backward compatibility
  languages?: string | null; // Deprecated: kept for backward compatibility
  environment_ids?: number[]; // New: array of environment IDs
  language_ids?: number[]; // New: array of language IDs
}

export const validateWorkExperienceData = (data: WorkExperienceCreateData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 必須項目チェック
  if (!data.start_date) {
    errors.push('開始日は必須です');
  } else if (!isValidDateFormat(data.start_date)) {
    errors.push('開始日の形式が不正です（YYYY-MM形式で入力してください）');
  }

  // 終了日のバリデーション
  if (data.end_date) {
    if (!isValidDateFormat(data.end_date)) {
      errors.push('終了日の形式が不正です（YYYY-MM形式で入力してください）');
    } else if (data.start_date && !isStartDateBeforeEndDate(data.start_date, data.end_date)) {
      errors.push('終了日は開始日以降の日付を指定してください');
    }
  }

  // ブール値フィールドのバリデーション（0 or 1）
  const booleanFields = [
    'requirement_analysis',
    'basic_design',
    'detail_design',
    'development',
    'testing',
    'operation',
  ];

  booleanFields.forEach((field) => {
    const value = (data as any)[field];
    if (value !== undefined && value !== null && value !== 0 && value !== 1) {
      errors.push(`${field}は0または1で指定してください`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
