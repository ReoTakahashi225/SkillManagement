import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { searchUsers } from '../api/search';
import type { SearchResult } from '../api/search';
import { getMasterData } from '../api/masterData';
import type { Language, Environment, Industry } from '../types';
import toast, { Toaster } from 'react-hot-toast';

export default function Search() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);

  // Search criteria
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<number[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([]);
  const [certifications, setCertifications] = useState('');

  // Search results
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadMasterData();
  }, [token]);

  const loadMasterData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const data = await getMasterData(token);
      setLanguages(data.languages);
      setEnvironments(data.environments);
      setIndustries(data.industries);
    } catch (error) {
      console.error('Failed to load master data:', error);
      toast.error('マスターデータの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!token) return;

    // 検索条件が1つも選択されていない場合
    if (
      selectedLanguages.length === 0 &&
      selectedEnvironments.length === 0 &&
      selectedIndustries.length === 0 &&
      !certifications.trim()
    ) {
      toast.error('検索条件を1つ以上選択してください');
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchUsers(
        {
          languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
          environments: selectedEnvironments.length > 0 ? selectedEnvironments : undefined,
          industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
          certifications: certifications.trim() || undefined,
        },
        token
      );
      setSearchResults(results.users);
      setHasSearched(true);
      toast.success(`${results.users.length}件の結果が見つかりました`);
    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error('検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSelectedLanguages([]);
    setSelectedEnvironments([]);
    setSelectedIndustries([]);
    setCertifications('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const toggleSelection = (id: number, selected: number[], setSelected: (ids: number[]) => void) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  // Filter work experiences to show only those matching search criteria
  const filterMatchingWorkExperiences = (workExperiences: any[]) => {
    return workExperiences.filter((we) => {
      // Check if any language matches
      const hasMatchingLanguage = selectedLanguages.length === 0 ||
        (we.languages && we.languages.some((lang: any) => selectedLanguages.includes(lang.id)));

      // Check if any environment matches
      const hasMatchingEnvironment = selectedEnvironments.length === 0 ||
        (we.environments && we.environments.some((env: any) => selectedEnvironments.includes(env.id)));

      // Check if industry matches
      const hasMatchingIndustry = selectedIndustries.length === 0 ||
        (we.industry && selectedIndustries.includes(we.industry.id));

      // Return true if at least one criterion matches (OR logic)
      return hasMatchingLanguage || hasMatchingEnvironment || hasMatchingIndustry;
    });
  };

  // Check if an item is in the search criteria
  const isHighlighted = (id: number, type: 'language' | 'environment' | 'industry') => {
    if (type === 'language') return selectedLanguages.includes(id);
    if (type === 'environment') return selectedEnvironments.includes(id);
    if (type === 'industry') return selectedIndustries.includes(id);
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Loading fullScreen text="データを読み込んでいます..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster position="top-center" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">さがす</h1>
          <p className="text-gray-600">
            言語・環境・業種・資格から人材を検索できます
          </p>
        </div>

        {/* 検索条件 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">検索条件</h2>

          {/* 言語 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">言語</h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => toggleSelection(lang.id, selectedLanguages, setSelectedLanguages)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedLanguages.includes(lang.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* 環境 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">環境</h3>
            <div className="flex flex-wrap gap-2">
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => toggleSelection(env.id, selectedEnvironments, setSelectedEnvironments)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedEnvironments.includes(env.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {env.name}
                </button>
              ))}
            </div>
          </div>

          {/* 業種 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">業種</h3>
            <div className="flex flex-wrap gap-2">
              {industries.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => toggleSelection(ind.id, selectedIndustries, setSelectedIndustries)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedIndustries.includes(ind.id)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ind.name}
                </button>
              ))}
            </div>
          </div>

          {/* 資格 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">資格</h3>
            <input
              type="text"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder="資格名で検索（例：基本情報技術者）"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 検索ボタン */}
          <div className="flex gap-4">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`flex-1 px-6 py-3 rounded-lg font-bold text-white transition-colors ${
                isSearching
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSearching ? '検索中...' : '検索'}
            </button>
            <button
              onClick={handleReset}
              disabled={isSearching}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
            >
              リセット
            </button>
          </div>
        </div>

        {/* 検索結果 */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              検索結果 ({searchResults.length}件)
            </h2>

            {searchResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-lg">該当する人材が見つかりませんでした</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((user) => {
                  const matchingWorkExperiences = filterMatchingWorkExperiences(user.work_experiences || []);
                  return (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {user.full_name || user.username}
                          </h3>
                          {user.age && (
                            <p className="text-sm text-gray-600">{user.age}歳</p>
                          )}
                        </div>
                        <a
                          href={`/admin/users/${user.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          詳細を見る
                        </a>
                      </div>

                      {/* 資格 */}
                      {user.certifications && certifications && user.certifications.toLowerCase().includes(certifications.toLowerCase()) && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-1">資格:</p>
                          <p className="text-sm text-gray-600">{user.certifications}</p>
                        </div>
                      )}

                      {/* マッチした業務経験のみ表示 */}
                      {matchingWorkExperiences.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            マッチした業務経験 ({matchingWorkExperiences.length}件):
                          </p>
                          <div className="space-y-3">
                            {matchingWorkExperiences.slice(0, 3).map((we: any, index: number) => (
                              <div key={index} className="text-sm pl-4 border-l-3 border-blue-400 bg-blue-50 p-3 rounded">
                                <p className="font-medium text-gray-900 mb-1">{we.system_name || '案件名未設定'}</p>
                                <p className="text-xs text-gray-500 mb-2">
                                  {we.start_date} 〜 {we.end_date || '現在'}
                                </p>

                                {/* 業種 */}
                                {we.industry && (
                                  <div className="mb-2">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                      isHighlighted(we.industry.id, 'industry')
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {we.industry.name}
                                    </span>
                                  </div>
                                )}

                                {/* 使用言語 */}
                                {we.languages && we.languages.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-600 mb-1">使用言語:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {we.languages.map((lang: any) => (
                                        <span
                                          key={lang.id}
                                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                            isHighlighted(lang.id, 'language')
                                              ? 'bg-blue-600 text-white'
                                              : 'bg-blue-100 text-blue-700'
                                          }`}
                                        >
                                          {lang.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 使用環境 */}
                                {we.environments && we.environments.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">使用環境:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {we.environments.map((env: any) => (
                                        <span
                                          key={env.id}
                                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                            isHighlighted(env.id, 'environment')
                                              ? 'bg-green-600 text-white'
                                              : 'bg-green-100 text-green-700'
                                          }`}
                                        >
                                          {env.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            {matchingWorkExperiences.length > 3 && (
                              <p className="text-xs text-gray-500 pl-4">
                                ...他{matchingWorkExperiences.length - 3}件のマッチした業務経験
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
