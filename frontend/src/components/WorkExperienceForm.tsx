import { useState, useEffect, FormEvent } from 'react';
import type { WorkExperience, MasterEnvironment, MasterLanguage, MasterIndustry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getAllEnvironments, getAllLanguages, getAllIndustries } from '../api/masterData';
import MultiSelect from './MultiSelect';

interface WorkExperienceFormProps {
  workExperience?: WorkExperience | null;
  onSubmit: (data: WorkExperienceFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface WorkExperienceFormData {
  start_date: string;
  end_date: string | null;
  industry: string; // Deprecated: kept for backward compatibility
  industry_id: number | null; // New: industry master ID
  customer_name: string;
  system_name: string;
  requirement_analysis: number;
  basic_design: number;
  detail_design: number;
  development: number;
  testing: number;
  operation: number;
  environment: string; // Deprecated: kept for backward compatibility
  languages: string; // Deprecated: kept for backward compatibility
  environment_ids: number[]; // New: array of selected environment IDs
  language_ids: number[]; // New: array of selected language IDs
}

export default function WorkExperienceForm({
  workExperience,
  onSubmit,
  onCancel,
  isLoading = false,
}: WorkExperienceFormProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<WorkExperienceFormData>({
    start_date: '',
    end_date: null,
    industry: '',
    industry_id: null,
    customer_name: '',
    system_name: '',
    requirement_analysis: 0,
    basic_design: 0,
    detail_design: 0,
    development: 0,
    testing: 0,
    operation: 0,
    environment: '',
    languages: '',
    environment_ids: [],
    language_ids: [],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isOngoing, setIsOngoing] = useState(false);
  const [environments, setEnvironments] = useState<MasterEnvironment[]>([]);
  const [languages, setLanguages] = useState<MasterLanguage[]>([]);
  const [industries, setIndustries] = useState<MasterIndustry[]>([]);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);

  // Fetch master data on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      if (!token) return;

      try {
        setIsLoadingMasterData(true);
        const [envsData, langsData, indsData] = await Promise.all([
          getAllEnvironments(token),
          getAllLanguages(token),
          getAllIndustries(token),
        ]);
        setEnvironments(envsData.environments);
        setLanguages(langsData.languages);
        setIndustries(indsData.industries);
      } catch (error) {
        console.error('Failed to load master data:', error);
      } finally {
        setIsLoadingMasterData(false);
      }
    };

    fetchMasterData();
  }, [token]);

  // 編集モード時に既存データをセット
  useEffect(() => {
    if (workExperience) {
      setFormData({
        start_date: workExperience.start_date,
        end_date: workExperience.end_date,
        industry: workExperience.industry || '',
        industry_id: workExperience.industry_id || null,
        customer_name: workExperience.customer_name || '',
        system_name: workExperience.system_name || '',
        requirement_analysis: workExperience.requirement_analysis,
        basic_design: workExperience.basic_design,
        detail_design: workExperience.detail_design,
        development: workExperience.development,
        testing: workExperience.testing,
        operation: workExperience.operation,
        environment: workExperience.environment || '',
        languages: workExperience.languages || '',
        environment_ids: workExperience.environment_ids || [],
        language_ids: workExperience.language_ids || [],
      });
      setIsOngoing(!workExperience.end_date);
    }
  }, [workExperience]);

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.start_date) {
      newErrors.push('開始年月は必須です');
    }

    if (!isOngoing && !formData.end_date) {
      newErrors.push('終了年月を入力するか、「現在進行中」にチェックしてください');
    }

    if (!isOngoing && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.push('終了年月は開始年月以降の日付を指定してください');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      ...formData,
      end_date: isOngoing ? null : formData.end_date,
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      // エラーは親コンポーネントで処理
    }
  };

  const handleCheckboxChange = (field: keyof WorkExperienceFormData) => {
    setFormData({
      ...formData,
      [field]: formData[field] === 1 ? 0 : 1,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {workExperience ? '業務実績を編集' : '業務実績を追加'}
          </h2>

          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 mb-1">入力エラー</p>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* 期間 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    開始年月 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="month"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    終了年月 {!isOngoing && <span className="text-red-600">*</span>}
                  </label>
                  <input
                    type="month"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={isOngoing}
                  />
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={isOngoing}
                      onChange={(e) => {
                        setIsOngoing(e.target.checked);
                        if (e.target.checked) {
                          setFormData({ ...formData, end_date: null });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">現在進行中</span>
                  </label>
                </div>
              </div>

              {/* 業種 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  業種
                </label>
                <select
                  value={formData.industry_id || ''}
                  onChange={(e) => setFormData({ ...formData, industry_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* お客様名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  お客様名
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 株式会社〇〇"
                />
              </div>

              {/* システム名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  システム名
                </label>
                <input
                  type="text"
                  value={formData.system_name}
                  onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: オンラインバンキングシステム"
                />
              </div>

              {/* 担当業務 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  担当業務
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'requirement_analysis', label: '要件定義' },
                    { key: 'basic_design', label: '基本設計' },
                    { key: 'detail_design', label: '詳細設計' },
                    { key: 'development', label: '開発' },
                    { key: 'testing', label: 'テスト' },
                    { key: 'operation', label: '運用' },
                  ].map((phase) => (
                    <label key={phase.key} className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[phase.key as keyof WorkExperienceFormData] === 1}
                        onChange={() => handleCheckboxChange(phase.key as keyof WorkExperienceFormData)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{phase.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 開発環境 */}
              <div>
                <MultiSelect
                  label="開発環境"
                  options={environments}
                  selectedIds={formData.environment_ids}
                  onChange={(ids) => setFormData({ ...formData, environment_ids: ids })}
                  placeholder="環境を選択してください"
                  groupByCategory={true}
                />
              </div>

              {/* 開発言語 */}
              <div>
                <MultiSelect
                  label="開発言語・技術"
                  options={languages}
                  selectedIds={formData.language_ids}
                  onChange={(ids) => setFormData({ ...formData, language_ids: ids })}
                  placeholder="言語・技術を選択してください"
                  groupByCategory={true}
                />
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>処理中...</span>
                  </>
                ) : (
                  <span>{workExperience ? '更新する' : '登録する'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
