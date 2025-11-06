import type { AnalyticsData, MasterEnvironment, MasterLanguage } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface AnalyticsChartsProps {
  analyticsData: AnalyticsData;
  environments: MasterEnvironment[];
  languages: MasterLanguage[];
}

export default function AnalyticsCharts({ analyticsData, environments, languages }: AnalyticsChartsProps) {
  // Industry experience chart data
  const industryChartData = {
    labels: analyticsData.industryExperience.map((item) => item.industry),
    datasets: [
      {
        label: '経験月数',
        data: analyticsData.industryExperience.map((item) => item.months),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Technology frequency chart data (Environments)
  const environmentColors = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)',
    'rgba(83, 102, 255, 0.6)',
    'rgba(255, 99, 255, 0.6)',
    'rgba(99, 255, 132, 0.6)',
  ];

  const environmentChartData = {
    labels: analyticsData.technologies.environments.map((item) => item.name),
    datasets: [
      {
        label: '使用回数',
        data: analyticsData.technologies.environments.map((item) => item.count),
        backgroundColor: environmentColors,
        borderWidth: 1,
      },
    ],
  };

  // Technology frequency chart data (Languages)
  const languageChartData = {
    labels: analyticsData.technologies.languages.map((item) => item.name),
    datasets: [
      {
        label: '使用回数',
        data: analyticsData.technologies.languages.map((item) => item.count),
        backgroundColor: environmentColors,
        borderWidth: 1,
      },
    ],
  };

  // Task breakdown chart data
  const taskChartData = {
    labels: analyticsData.taskBreakdown.map((item) => item.task),
    datasets: [
      {
        label: '担当回数',
        data: analyticsData.taskBreakdown.map((item) => item.count),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  // Helper to get environment name by ID
  const getEnvironmentName = (id: number): string => {
    const env = environments.find((e) => e.id === id);
    return env ? env.name : '';
  };

  // Helper to get language name by ID
  const getLanguageName = (id: number): string => {
    const lang = languages.find((l) => l.id === id);
    return lang ? lang.name : '';
  };

  // Helper to format date
  const formatDate = (dateStr: string): string => {
    const [year, month] = dateStr.split('-');
    return `${year}年${month}月`;
  };

  return (
    <>
      {/* Industry Experience Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">業種別経験年数</h2>
        <div className="h-80">
          <Bar data={industryChartData} options={chartOptions} />
        </div>
      </div>

      {/* Technology Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Environment Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">開発環境の使用頻度</h2>
          <div className="h-80">
            {analyticsData.technologies.environments.length > 0 ? (
              <Pie data={environmentChartData} options={pieChartOptions} />
            ) : (
              <p className="text-gray-500 text-center">データがありません</p>
            )}
          </div>
        </div>

        {/* Language Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">開発言語・技術の使用頻度</h2>
          <div className="h-80">
            {analyticsData.technologies.languages.length > 0 ? (
              <Pie data={languageChartData} options={pieChartOptions} />
            ) : (
              <p className="text-gray-500 text-center">データがありません</p>
            )}
          </div>
        </div>
      </div>

      {/* Task Breakdown Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">担当業務の内訳</h2>
        <div className="h-80">
          <Bar data={taskChartData} options={chartOptions} />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">年表形式のタイムライン</h2>
        <div className="space-y-6">
          {analyticsData.timeline.map((we, index) => (
            <div key={we.id} className="relative pl-8 pb-6 border-l-2 border-blue-500">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {we.system_name || '案件' + (index + 1)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(we.start_date)} - {we.end_date ? formatDate(we.end_date) : '現在'}
                    </p>
                  </div>
                  {we.industry && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {we.industry}
                    </span>
                  )}
                </div>

                {we.customer_name && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">お客様:</span> {we.customer_name}
                  </p>
                )}

                {/* Tasks */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">担当業務:</p>
                  <div className="flex flex-wrap gap-2">
                    {we.requirement_analysis === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        要件定義
                      </span>
                    )}
                    {we.basic_design === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        基本設計
                      </span>
                    )}
                    {we.detail_design === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        詳細設計
                      </span>
                    )}
                    {we.development === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        開発
                      </span>
                    )}
                    {we.testing === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        テスト
                      </span>
                    )}
                    {we.operation === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        運用
                      </span>
                    )}
                  </div>
                </div>

                {/* Environments */}
                {we.environment_ids && we.environment_ids.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">開発環境:</p>
                    <div className="flex flex-wrap gap-2">
                      {we.environment_ids.map((envId) => (
                        <span
                          key={envId}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                        >
                          {getEnvironmentName(envId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {we.language_ids && we.language_ids.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">開発言語・技術:</p>
                    <div className="flex flex-wrap gap-2">
                      {we.language_ids.map((langId) => (
                        <span
                          key={langId}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800"
                        >
                          {getLanguageName(langId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
