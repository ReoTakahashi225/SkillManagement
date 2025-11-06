import type { WorkExperience } from '../types';

interface WorkExperienceCardProps {
  workExperience?: WorkExperience;
  experience?: WorkExperience;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  hideActions?: boolean;
}

export default function WorkExperienceCard({
  workExperience,
  experience,
  onEdit,
  onDelete,
  hideActions = false
}: WorkExperienceCardProps) {
  // Support both prop names for backward compatibility
  const exp = workExperience || experience;
  if (!exp) return null;
  // 日付フォーマット関数
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    return `${year}年${month}月`;
  };

  // 期間表示
  const period = exp.end_date
    ? `${formatDate(exp.start_date)} 〜 ${formatDate(exp.end_date)}`
    : `${formatDate(exp.start_date)} 〜 現在`;

  // 担当業務のバッジデータ
  const phases = [
    { key: 'requirement_analysis', label: '要件定義', value: exp.requirement_analysis },
    { key: 'basic_design', label: '基本設計', value: exp.basic_design },
    { key: 'detail_design', label: '詳細設計', value: exp.detail_design },
    { key: 'development', label: '開発', value: exp.development },
    { key: 'testing', label: 'テスト', value: exp.testing },
    { key: 'operation', label: '運用', value: exp.operation },
  ];

  const activePhases = phases.filter(phase => phase.value === 1);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {exp.system_name || '未設定'}
          </h3>
          <p className="text-sm text-gray-600">{period}</p>
        </div>

        {exp.industry && (
          <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
            {exp.industry}
          </span>
        )}
      </div>

      {/* 担当業務バッジ */}
      {activePhases.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">担当業務</p>
          <div className="flex flex-wrap gap-2">
            {activePhases.map((phase) => (
              <span
                key={phase.key}
                className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded"
              >
                {phase.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 開発環境 */}
      {exp.environment && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">開発環境</p>
          <p className="text-sm text-gray-800">{exp.environment}</p>
        </div>
      )}

      {/* 言語・技術 */}
      {exp.languages && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">言語・技術</p>
          <p className="text-sm text-gray-800">{exp.languages}</p>
        </div>
      )}

      {/* アクションボタン */}
      {!hideActions && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={() => onEdit(exp.id)}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              編集
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(exp.id)}
              className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
