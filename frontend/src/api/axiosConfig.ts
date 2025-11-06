import axios from 'axios';
import toast from 'react-hot-toast';

export const API_BASE_URL = 'http://localhost:3000/api';

// Axiosインスタンスを作成
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// レスポンスインターセプター: グローバルエラーハンドリング
axiosInstance.interceptors.response.use(
  (response) => {
    // 成功時はそのまま返す
    return response;
  },
  (error) => {
    // エラー時の処理
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          // 401エラー時は自動ログアウト
          toast.error('セッションが期限切れです。再度ログインしてください。');
          localStorage.removeItem('token');
          // ログインページにリダイレクト
          window.location.href = '/login';
          break;

        case 403:
          toast.error('この操作を実行する権限がありません。');
          break;

        case 404:
          toast.error('リソースが見つかりませんでした。');
          break;

        case 500:
        case 502:
        case 503:
          toast.error('サーバーエラーが発生しました。しばらく待ってから再度お試しください。');
          break;

        default:
          // その他のエラーは個別に処理
          break;
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      toast.error('ネットワークエラーが発生しました。接続を確認してください。');
    } else {
      // リクエスト設定時のエラー
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
