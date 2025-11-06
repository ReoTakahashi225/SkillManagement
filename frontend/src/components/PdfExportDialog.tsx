import { useState } from 'react';
import type { PdfExportSettings } from '../types';

interface PdfExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: PdfExportSettings) => void;
  isExporting: boolean;
}

export default function PdfExportDialog({
  isOpen,
  onClose,
  onExport,
  isExporting,
}: PdfExportDialogProps) {
  const [settings, setSettings] = useState<PdfExportSettings>({
    nameDisplay: 'initials',
    ageFormat: 'exact',
  });

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(settings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">PDF出力設定</h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 設定項目 */}
        <div className="space-y-6">
          {/* 氏名表示 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              氏名の表示方法
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="nameDisplay"
                  value="initials"
                  checked={settings.nameDisplay === 'initials'}
                  onChange={(e) => setSettings({ ...settings, nameDisplay: e.target.value as 'initials' | 'fullName' })}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">イニシャル</div>
                  <div className="text-xs text-gray-500">例: T.Y.</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="nameDisplay"
                  value="fullName"
                  checked={settings.nameDisplay === 'fullName'}
                  onChange={(e) => setSettings({ ...settings, nameDisplay: e.target.value as 'initials' | 'fullName' })}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">氏名</div>
                  <div className="text-xs text-gray-500">例: 山田 太郎</div>
                </div>
              </label>
            </div>
          </div>

          {/* 年齢表示 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              年齢の表示方法
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="ageFormat"
                  value="exact"
                  checked={settings.ageFormat === 'exact'}
                  onChange={(e) => setSettings({ ...settings, ageFormat: e.target.value as 'exact' | 'decade' })}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">1の位まで表示</div>
                  <div className="text-xs text-gray-500">例: 35歳</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="ageFormat"
                  value="decade"
                  checked={settings.ageFormat === 'decade'}
                  onChange={(e) => setSettings({ ...settings, ageFormat: e.target.value as 'exact' | 'decade' })}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">年代表示</div>
                  <div className="text-xs text-gray-500">例: 30代</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>生成中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF出力</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
