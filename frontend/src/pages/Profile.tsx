import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { getUserProfile, updateUserProfile } from '../api/workExperience';
import { changePassword } from '../api/auth';
import type { UpdateUserProfileData } from '../api/workExperience';
import type { UserProfile } from '../types';
import toast, { Toaster } from 'react-hot-toast';

export default function Profile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<UpdateUserProfileData>({
    initials: '',
    gender: 0,
    birthdate: null,
    age: null,
    address: '',
    education: '',
    major: '',
    certifications: '',
    remarks: '',
  });

  // パスワード変更用のstate
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 生年月日から年齢を自動計算
  const calculateAge = (birthdate: string | null): number | null => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const { profile } = await getUserProfile(token);
      setProfile(profile);
      const calculatedAge = calculateAge(profile.birthdate);
      setFormData({
        initials: profile.initials || '',
        gender: profile.gender || 0,
        birthdate: profile.birthdate || null,
        age: calculatedAge,
        address: profile.address || '',
        education: profile.education || '',
        major: profile.major || '',
        certifications: profile.certifications || '',
        remarks: profile.remarks || '',
      });
    } catch (err: any) {
      console.error('プロフィールの取得に失敗しました:', err);
      toast.error('プロフィールの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      const calculatedAge = calculateAge(profile.birthdate);
      setFormData({
        initials: profile.initials || '',
        gender: profile.gender || 0,
        birthdate: profile.birthdate || null,
        age: calculatedAge,
        address: profile.address || '',
        education: profile.education || '',
        major: profile.major || '',
        certifications: profile.certifications || '',
        remarks: profile.remarks || '',
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) return;

    try {
      setIsSubmitting(true);

      const { profile: updatedProfile } = await updateUserProfile(formData, token);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('プロフィールを更新しました');
    } catch (err: any) {
      console.error('更新に失敗しました:', err);
      if (err.response?.data?.details) {
        toast.error(`入力エラー:\n${err.response.data.details.join('\n')}`);
      } else {
        toast.error('更新に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!token) return;

    // バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('すべての項目を入力してください');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('新しいパスワードは6文字以上必要です');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません');
      return;
    }

    try {
      setIsChangingPassword(true);
      toast.loading('パスワードを変更しています...', { id: 'password-change' });

      await changePassword(currentPassword, newPassword, token);

      toast.success('パスワードを変更しました', { id: 'password-change' });
      setShowPasswordDialog(false);
      setCurrentPassword('');
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
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Loading fullScreen text="プロフィールを読み込んでいます..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">プロフィール</h2>
            <p className="text-sm text-gray-600 mt-1">
              基本情報を管理します
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              編集する
            </button>
          )}
        </div>

        {/* プロフィールカード */}
        <div className="bg-white rounded-lg shadow-md">
          {isEditing ? (
            // 編集モード
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* イニシャル */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    イニシャル
                  </label>
                  <input
                    type="text"
                    value={formData.initials}
                    onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: T.Y."
                    maxLength={10}
                  />
                </div>

                {/* 性別 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    性別
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={1}
                        checked={formData.gender === 1}
                        onChange={(e) => setFormData({ ...formData, gender: parseInt(e.target.value) })}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span>男性</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={2}
                        checked={formData.gender === 2}
                        onChange={(e) => setFormData({ ...formData, gender: parseInt(e.target.value) })}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span>女性</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={0}
                        checked={formData.gender === 0}
                        onChange={(e) => setFormData({ ...formData, gender: parseInt(e.target.value) })}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span>未設定</span>
                    </label>
                  </div>
                </div>

                {/* 生年月日 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    生年月日
                    {formData.birthdate && formData.age !== null && (
                      <span className="text-xs text-gray-500 ml-2">
                        （現在{formData.age}歳）
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate || ''}
                    onChange={(e) => {
                      const newBirthdate = e.target.value || null;
                      const newAge = calculateAge(newBirthdate);
                      setFormData({ ...formData, birthdate: newBirthdate, age: newAge });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 住所 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    住所
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="東京都渋谷区"
                  />
                </div>

                {/* 最終学歴 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    最終学歴
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="〇〇大学 工学部"
                  />
                </div>

                {/* 学科 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    学科
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="情報工学科"
                  />
                </div>

                {/* 資格 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    資格
                  </label>
                  <textarea
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="基本情報技術者試験、応用情報技術者試験"
                  />
                </div>

                {/* 備考 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    備考
                    <span className="text-xs text-gray-500 ml-2">
                      (最大500文字)
                    </span>
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    placeholder="特記事項やアピールポイントを記入してください"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {formData.remarks?.length || 0} / 500文字
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>保存中...</span>
                    </>
                  ) : (
                    <span>保存する</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // 表示モード
            <div className="p-6">
              <div className="space-y-6">
                {/* イニシャル */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">イニシャル</h3>
                  <p className="text-lg text-gray-900">{profile?.initials || '未設定'}</p>
                </div>

                {/* 性別 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">性別</h3>
                  <p className="text-lg text-gray-900">
                    {profile?.gender === 1 ? '男性' : profile?.gender === 2 ? '女性' : '未設定'}
                  </p>
                </div>

                {/* 生年月日・年齢 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">生年月日</h3>
                  <p className="text-lg text-gray-900">
                    {profile?.birthdate ? (
                      <>
                        {profile.birthdate}
                        {profile.age !== null && <span className="text-gray-600 ml-2">（{profile.age}歳）</span>}
                      </>
                    ) : '未設定'}
                  </p>
                </div>

                {/* 住所 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">住所</h3>
                  <p className="text-lg text-gray-900">{profile?.address || '未設定'}</p>
                </div>

                {/* 最終学歴 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">最終学歴</h3>
                  <p className="text-lg text-gray-900">{profile?.education || '未設定'}</p>
                </div>

                {/* 学科 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">学科</h3>
                  <p className="text-lg text-gray-900">{profile?.major || '未設定'}</p>
                </div>

                {/* 資格 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">資格</h3>
                  <p className="text-lg text-gray-900 whitespace-pre-wrap">{profile?.certifications || '未設定'}</p>
                </div>

                {/* 備考 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">備考</h3>
                  <p className="text-lg text-gray-900 whitespace-pre-wrap">{profile?.remarks || '未設定'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* パスワード変更セクション */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">パスワード変更</h3>
              <p className="text-sm text-gray-600 mt-1">
                セキュリティのため、定期的にパスワードを変更することをお勧めします
              </p>
            </div>
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              パスワードを変更
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ※ パスワードを忘れた場合は、管理者にお問い合わせください
          </p>
        </div>

        {/* 技術スキル（将来拡張用） */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                技術スキル管理
              </p>
              <p className="text-xs text-blue-700 mt-1">
                今後、技術スキル一覧機能を追加予定です
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* パスワード変更ダイアログ */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">パスワード変更</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  現在のパスワード
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="現在のパスワードを入力"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isChangingPassword}
                />
              </div>

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
                  新しいパスワード（確認）
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
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className={`px-4 py-2 ${
                  isChangingPassword || !currentPassword || !newPassword || !confirmPassword
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
