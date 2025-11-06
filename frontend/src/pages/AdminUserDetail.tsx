import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Loading from '../components/Loading';
import WorkExperienceCard from '../components/WorkExperienceCard';
import PdfExportDialog from '../components/PdfExportDialog';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { getUserById, importWorkExperiences, importWorkExperiencesFromFile, changeUserPassword } from '../api/admin';
import { exportPDFForUser, downloadPDF } from '../api/export';
import { getAnalyticsForUser } from '../api/analytics';
import { getAllEnvironments, getAllLanguages } from '../api/masterData';
import type { User, UserProfile, WorkExperience, PdfExportSettings, AnalyticsData, MasterEnvironment, MasterLanguage } from '../types';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [environments, setEnvironments] = useState<MasterEnvironment[]>([]);
  const [languages, setLanguages] = useState<MasterLanguage[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (currentUser && currentUser.role !== 'admin') {
      toast.error('管理者権限が必要です');
      navigate('/dashboard');
      return;
    }

    fetchUserData();
  }, [id, currentUser, navigate, token]);

  const fetchUserData = async () => {
    if (!token || !id) return;

    try {
      setIsLoading(true);
      const data = await getUserById(parseInt(id), token);
      setUser(data.user);
      setProfile(data.user.profile);
      setWorkExperiences(data.user.workExperiences);
    } catch (err: any) {
      console.error('ユーザーデータの取得に失敗しました:', err);
      if (err.response?.status === 403) {
        toast.error('管理者権限が必要です');
        navigate('/dashboard');
      } else if (err.response?.status === 404) {
        toast.error('ユーザーが見つかりません');
        navigate('/admin/users');
      } else {
        toast.error('データの取得に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPdfDialog = () => {
    setShowPdfDialog(true);
  };

  const handlePdfDialogClose = () => {
    setShowPdfDialog(false);
  };

  const handleExportPDF = async (settings: PdfExportSettings) => {
    if (!token || !id) return;

    try {
      setIsExportingPDF(true);
      toast.loading('PDFを生成中...', { id: 'pdf-export' });

      const { blob, filename } = await exportPDFForUser(parseInt(id), token, settings);
      downloadPDF(blob, filename);

      toast.success('PDFをダウンロードしました', { id: 'pdf-export' });
      setShowPdfDialog(false);
    } catch (err: any) {
      console.error('PDF出力に失敗しました:', err);
      if (err.response?.status === 403) {
        toast.error('管理者権限が必要です', { id: 'pdf-export' });
      } else {
        toast.error('PDF生成に失敗しました。もう一度お試しください。', { id: 'pdf-export' });
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleToggleAnalytics = async () => {
    if (!showAnalytics) {
      // Load analytics data when opening
      if (!token || !id) return;

      try {
        setIsLoadingAnalytics(true);

        const [analyticsRes, envsData, langsData] = await Promise.all([
          getAnalyticsForUser(parseInt(id), token),
          getAllEnvironments(token),
          getAllLanguages(token),
        ]);

        setAnalyticsData(analyticsRes.analytics);
        setEnvironments(envsData.environments);
        setLanguages(langsData.languages);
        setShowAnalytics(true);
      } catch (err: any) {
        console.error('アナリティクスデータの取得に失敗しました:', err);
        if (err.response?.status === 403) {
          toast.error('管理者権限が必要です');
        } else {
          toast.error('データの取得に失敗しました');
        }
      } finally {
        setIsLoadingAnalytics(false);
      }
    } else {
      // Just toggle visibility
      setShowAnalytics(false);
    }
  };

  const handleImportClick = () => {
    if (workExperiences.length > 0) {
      toast.error('このユーザーには既に業務実績が登録されています');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token || !id) return;

    try {
      setIsImporting(true);

      // Check if it's a JSON file or PDF/Excel
      const isJsonFile = file.name.toLowerCase().endsWith('.json');

      if (isJsonFile) {
        // Handle JSON import (existing functionality)
        toast.loading('JSONファイルを読み込んでいます...', { id: 'import' });

        const fileContent = await file.text();
        const jsonData = JSON.parse(fileContent);

        // Validate JSON structure
        if (!Array.isArray(jsonData)) {
          throw new Error('JSONファイルは配列形式である必要があります');
        }

        toast.loading(`${jsonData.length}件の業務実績をインポート中...`, { id: 'import' });

        const result = await importWorkExperiences(parseInt(id), jsonData, token);

        toast.success(result.message, { id: 'import' });

        if (result.errors && result.errors.length > 0) {
          toast.error(`エラー: ${result.errors.join(', ')}`, { duration: 5000 });
        }
      } else {
        // Handle PDF/Excel import with Gemini
        toast.loading('ファイルを解析中... (Gemini APIを使用)', { id: 'import' });

        const result = await importWorkExperiencesFromFile(parseInt(id), file, token);

        toast.success(result.message, { id: 'import' });

        if (result.errors && result.errors.length > 0) {
          toast.error(`エラー: ${result.errors.join(', ')}`, { duration: 5000 });
        }
      }

      // Refresh user data
      await fetchUserData();
    } catch (err: any) {
      console.error('インポートに失敗しました:', err);
      if (err instanceof SyntaxError) {
        toast.error('無効なJSONファイルです', { id: 'import' });
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error, { id: 'import' });
      } else if (err.response?.data?.details) {
        toast.error(`エラー: ${err.response.data.details}`, { id: 'import', duration: 5000 });
      } else if (err.message) {
        toast.error(err.message, { id: 'import' });
      } else {
        toast.error('インポートに失敗しました', { id: 'import' });
      }
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!token || !id) return;

    // Validation
    if (!newPassword || newPassword.length < 6) {
      toast.error('パスワードは6文字以上必要です');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('パスワードが一致しません');
      return;
    }

    try {
      setIsChangingPassword(true);
      toast.loading('パスワードを変更しています...', { id: 'password-change' });

      await changeUserPassword(parseInt(id), newPassword, token);

      toast.success('パスワードを変更しました', { id: 'password-change' });
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('パスワード変更に失敗しました:', err);
      if (err.response?.data?.error) {
        toast.error(err.response.data.error, { id: 'password-change' });
      } else {
        toast.error('パスワード変更に失敗しました', { id: 'password-change' });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordDialogClose = () => {
    setShowPasswordDialog(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  // Format phase badges
  const getPhases = (exp: WorkExperience) => {
    const phases = [];
    if (exp.requirement_analysis) phases.push('要件定義');
    if (exp.basic_design) phases.push('基本設計');
    if (exp.detail_design) phases.push('詳細設計');
    if (exp.development) phases.push('開発');
    if (exp.testing) phases.push('テスト');
    if (exp.operation) phases.push('運用');
    return phases;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Loading fullScreen text="ユーザーデータを読み込んでいます..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">ユーザーが見つかりませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/users')}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ユーザー一覧に戻る
        </button>

        {/* User Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">
                  {user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-900">{user.full_name || user.username}</h2>
                <p className="text-gray-600">@{user.username}</p>
                <p className="text-sm text-gray-500 mt-1">{user.email || 'メール未設定'}</p>
              </div>
            </div>
            <div>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {user.role === 'admin' ? '管理者' : 'ユーザー'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {workExperiences.length === 0 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.pdf,.xlsx,.xls,.docx,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className={`px-4 py-2 ${
                    isImporting
                      ? 'bg-orange-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  ファイルインポート
                </button>
              </>
            )}

            <button
              onClick={() => setShowPasswordDialog(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              パスワード変更
            </button>

            <button
              onClick={handleToggleAnalytics}
              disabled={isLoadingAnalytics}
              className={`px-4 py-2 ${
                isLoadingAnalytics
                  ? 'bg-blue-400 cursor-not-allowed'
                  : showAnalytics
                  ? 'bg-blue-700 hover:bg-blue-800'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {showAnalytics ? 'データ可視化を非表示' : 'データ可視化'}
            </button>

            <button
              onClick={handleOpenPdfDialog}
              disabled={isExportingPDF}
              className={`px-4 py-2 ${
                isExportingPDF
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              PDF出力
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">プロフィール</h3>

              {profile ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">年齢</p>
                    <p className="mt-1 text-gray-900">{profile.age !== null ? `${profile.age}歳` : '未設定'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">住所</p>
                    <p className="mt-1 text-gray-900">{profile.address || '未設定'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">最終学歴</p>
                    <p className="mt-1 text-gray-900">{profile.education || '未設定'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">学科</p>
                    <p className="mt-1 text-gray-900">{profile.major || '未設定'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">資格</p>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{profile.certifications || '未設定'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">プロフィール未設定</p>
              )}
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">統計情報</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">業務実績数</span>
                  <span className="text-lg font-semibold text-gray-900">{workExperiences.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">登録日</span>
                  <span className="text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">最終更新</span>
                  <span className="text-sm text-gray-900">
                    {new Date(user.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Experiences Section */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">業務実績 ({workExperiences.length}件)</h3>
            </div>

            {workExperiences.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="mt-4 text-gray-500">業務実績がまだ登録されていません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {workExperiences.map((exp) => (
                  <WorkExperienceCard
                    key={exp.id}
                    experience={exp}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    hideActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">データ可視化</h2>
              <p className="mt-2 text-gray-600">このユーザーの業務実績を可視化して分析します</p>
            </div>

            {isLoadingAnalytics ? (
              <Loading text="データを読み込んでいます..." />
            ) : analyticsData ? (
              <AnalyticsCharts
                analyticsData={analyticsData}
                environments={environments}
                languages={languages}
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">データがありません</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PDF出力設定ダイアログ */}
      <PdfExportDialog
        isOpen={showPdfDialog}
        onClose={handlePdfDialogClose}
        onExport={handleExportPDF}
        isExporting={isExportingPDF}
      />

      {/* パスワード変更ダイアログ */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">パスワード変更</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6文字以上"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isChangingPassword}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード確認
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="もう一度入力してください"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isChangingPassword}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordChange();
                    }
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handlePasswordDialogClose}
                disabled={isChangingPassword}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className={`px-4 py-2 ${
                  isChangingPassword || !newPassword || !confirmPassword
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white font-medium rounded-lg transition-colors`}
              >
                {isChangingPassword ? '変更中...' : 'パスワードを変更'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
