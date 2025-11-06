import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-gray-900">スキル管理システム</h1>

            {/* ナビゲーションリンク */}
            <nav className="flex gap-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                業務実績
              </Link>
              <Link
                to="/dashboard/analytics"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === '/dashboard/analytics'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                データ可視化
              </Link>
              <Link
                to="/profile"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === '/profile'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                プロフィール
              </Link>
              {/* 管理者専用メニュー */}
              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/search"
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                      location.pathname === '/search'
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    さがす
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    管理者
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600">ようこそ、</span>
              <span className="font-semibold text-gray-900 ml-1">
                {user?.full_name || user?.username}
              </span>
              <span className="text-gray-600">さん</span>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
