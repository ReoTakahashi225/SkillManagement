import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import WorkExperienceCard from '../components/WorkExperienceCard';
import WorkExperienceForm from '../components/WorkExperienceForm';
import type { WorkExperienceFormData } from '../components/WorkExperienceForm';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import PdfExportDialog from '../components/PdfExportDialog';
import Loading from '../components/Loading';
import {
  getWorkExperiences,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
} from '../api/workExperience';
import { exportPDF, downloadPDF } from '../api/export';
import type { WorkExperience, PdfExportSettings } from '../types';
import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  const { token } = useAuth();
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォーム関連の状態
  const [showForm, setShowForm] = useState(false);
  const [editingWorkExperience, setEditingWorkExperience] = useState<WorkExperience | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 削除確認ダイアログの状態
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // PDF出力の状態
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    fetchWorkExperiences();
  }, [token]);

  const fetchWorkExperiences = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const { workExperiences } = await getWorkExperiences(token);
      setWorkExperiences(workExperiences);
    } catch (err: any) {
      console.error('業務実績の取得に失敗しました:', err);
      const errorMessage = '業務実績の取得に失敗しました';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingWorkExperience(null);
    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    const workExperience = workExperiences.find((we) => we.id === id);
    if (workExperience) {
      setEditingWorkExperience(workExperience);
      setShowForm(true);
    }
  };

  const handleFormSubmit = async (data: WorkExperienceFormData) => {
    if (!token) return;

    const previousWorkExperiences = [...workExperiences];

    try {
      setIsSubmitting(true);

      if (editingWorkExperience) {
        // 楽観的UI更新: 編集内容を即座に反映
        const updatedWorkExperience = { ...editingWorkExperience, ...data };
        setWorkExperiences(
          workExperiences.map((we) =>
            we.id === editingWorkExperience.id ? updatedWorkExperience : we
          )
        );
        setShowForm(false);
        setEditingWorkExperience(null);

        // 更新
        await updateWorkExperience(editingWorkExperience.id, data, token);
        toast.success('業務実績を更新しました');

        // 最新データで更新
        await fetchWorkExperiences();
      } else {
        // 新規作成の場合はAPIレスポンスを待つ
        const result = await createWorkExperience(data, token);
        toast.success('業務実績を登録しました');

        // フォームを閉じる
        setShowForm(false);
        setEditingWorkExperience(null);

        // 一覧を再取得
        await fetchWorkExperiences();
      }
    } catch (err: any) {
      console.error('保存に失敗しました:', err);

      // エラー時は元に戻す（編集の場合のみ）
      if (editingWorkExperience) {
        setWorkExperiences(previousWorkExperiences);
        setShowForm(true);
      }

      if (err.response?.data?.details) {
        // バリデーションエラーの場合
        const errorMessage = err.response.data.details.join('\n');
        toast.error(`入力エラー:\n${errorMessage}`);
      } else {
        toast.error('保存に失敗しました。もう一度お試しください。');
      }
      throw err; // フォームを閉じないようにエラーを再スロー
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingWorkExperience(null);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deletingId) return;

    // 楽観的UI更新: 即座に一覧から削除
    const previousWorkExperiences = [...workExperiences];
    setWorkExperiences(workExperiences.filter((we) => we.id !== deletingId));
    setShowDeleteDialog(false);
    const tempDeletingId = deletingId;
    setDeletingId(null);

    try {
      setIsDeleting(true);
      await deleteWorkExperience(tempDeletingId, token);
      toast.success('業務実績を削除しました');
    } catch (err: any) {
      console.error('削除に失敗しました:', err);
      // エラー時は元に戻す
      setWorkExperiences(previousWorkExperiences);
      toast.error('削除に失敗しました。もう一度お試しください。');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingId(null);
  };

  const handleOpenPdfDialog = () => {
    setShowPdfDialog(true);
  };

  const handlePdfDialogClose = () => {
    setShowPdfDialog(false);
  };

  const handleExportPDF = async (settings: PdfExportSettings) => {
    if (!token) return;

    try {
      setIsExportingPDF(true);
      toast.loading('PDFを生成中...', { id: 'pdf-export' });

      const { blob, filename } = await exportPDF(token, settings);
      downloadPDF(blob, filename);

      toast.success('PDFをダウンロードしました', { id: 'pdf-export' });
      setShowPdfDialog(false);
    } catch (err: any) {
      console.error('PDF出力に失敗しました:', err);
      toast.error('PDF生成に失敗しました。もう一度お試しください。', { id: 'pdf-export' });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">業務実績一覧</h2>
            <p className="text-sm text-gray-600 mt-1">
              これまでの業務経験を管理します
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleOpenPdfDialog}
              disabled={isExportingPDF}
              className={`px-6 py-3 ${
                isExportingPDF
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2`}
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

            <button
              onClick={handleAddNew}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規追加
            </button>
          </div>
        </div>

        {/* ローディング状態 */}
        {isLoading && <Loading />}

        {/* エラー状態 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* 業務実績一覧 */}
        {!isLoading && !error && (
          <>
            {workExperiences.length === 0 ? (
              // 空の状態
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  業務実績がまだ登録されていません
                </h3>
                <p className="text-gray-600 mb-6">
                  「新規追加」ボタンから最初の業務実績を登録してみましょう
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  最初の業務実績を追加
                </button>
              </div>
            ) : (
              // 業務実績カード一覧
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workExperiences.map((workExperience) => (
                  <WorkExperienceCard
                    key={workExperience.id}
                    workExperience={workExperience}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            )}

            {/* 統計情報 */}
            {workExperiences.length > 0 && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      登録済み業務実績: {workExperiences.length}件
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      継続的にスキルと経験を記録しましょう
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* フォームモーダル */}
      {showForm && (
        <WorkExperienceForm
          workExperience={editingWorkExperience}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <DeleteConfirmDialog
          title="業務実績を削除"
          message="この業務実績を削除してもよろしいですか？この操作は取り消せません。"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
        />
      )}

      {/* PDF出力設定ダイアログ */}
      <PdfExportDialog
        isOpen={showPdfDialog}
        onClose={handlePdfDialogClose}
        onExport={handleExportPDF}
        isExporting={isExportingPDF}
      />
    </div>
  );
}
