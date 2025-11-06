import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import AnalyticsCharts from '../components/AnalyticsCharts';
import Loading from '../components/Loading';
import { getAnalytics } from '../api/analytics';
import { getAllEnvironments, getAllLanguages } from '../api/masterData';
import type { AnalyticsData, MasterEnvironment, MasterLanguage } from '../types';

export default function Analytics() {
  const { token } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [environments, setEnvironments] = useState<MasterEnvironment[]>([]);
  const [languages, setLanguages] = useState<MasterLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        setError(null);

        const [analyticsRes, envsData, langsData] = await Promise.all([
          getAnalytics(token),
          getAllEnvironments(token),
          getAllLanguages(token),
        ]);

        setAnalyticsData(analyticsRes.analytics);
        setEnvironments(envsData.environments);
        setLanguages(langsData.languages);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Loading fullScreen text="データを読み込んでいます..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">データがありません</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">データ可視化</h1>
          <p className="mt-2 text-gray-600">業務実績のデータを可視化して分析します</p>
        </div>

        <AnalyticsCharts
          analyticsData={analyticsData}
          environments={environments}
          languages={languages}
        />
      </main>
    </div>
  );
}
