# スキル管理システム

フルスタックのスキル管理システム - 業務経験、スキル、資格を管理するWebアプリケーション

## 機能

- **ユーザー認証**: JWT認証によるログイン・ログアウト
- **プロフィール管理**: 個人情報、学歴、資格の管理
- **業務経験管理**: プロジェクト経験の記録と管理
- **スキル検索**: 言語・環境・業種・資格による人材検索（管理者専用）
  - 複数条件での検索（言語・環境・業種・資格）
  - マッチした業務経験のみをハイライト表示
  - 検索条件に該当する項目を色分けして表示
- **データ可視化**: Chart.jsによるスキル分析とグラフ表示
- **ファイルインポート**: Gemini AIを使用したPDF/Excelからの業務経験自動抽出
- **管理者機能**: ユーザー管理、一括操作、全ユーザー検索

## 技術スタック

### フロントエンド
- React 18
- TypeScript
- Vite
- React Router
- TailwindCSS
- Chart.js
- React Hot Toast

### バックエンド
- Node.js
- Express
- TypeScript
- SQLite (WALモード + パフォーマンス最適化)
- JWT認証
- Gemini AI API

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd スキル管理システム
```

2. 依存関係のインストール
```bash
npm run install-all
```

3. バックエンド環境変数の設定
`backend/.env` ファイルを作成:
```env
PORT=3001
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
```

4. データベースの初期化
```bash
cd backend
npm run migrate
npm run seed
npm run db:optimize  # パフォーマンスインデックスを適用
```

### 開発サーバーの起動

バックエンドとフロントエンドを別々のターミナルで起動:

```bash
# ターミナル1: バックエンド
npm run dev:backend

# ターミナル2: フロントエンド
npm run dev:frontend
```

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3001

### デフォルトアカウント

管理者:
- ユーザー名: `admin`
- パスワード: `admin123`

一般ユーザー:
- ユーザー名: `user`
- パスワード: `user123`

## プロジェクト構成

```
スキル管理システム/
├── backend/              # バックエンド（Express + TypeScript）
│   ├── src/
│   │   ├── controllers/ # コントローラー
│   │   ├── database/    # データベース関連
│   │   ├── middleware/  # 認証ミドルウェア
│   │   ├── routes/      # APIルート
│   │   ├── services/    # Gemini AIサービス
│   │   └── index.ts     # エントリーポイント
│   ├── database.sqlite  # SQLiteデータベース
│   └── uploads/         # アップロードファイル
├── frontend/            # フロントエンド（React + TypeScript）
│   ├── src/
│   │   ├── api/         # APIクライアント
│   │   ├── components/  # Reactコンポーネント
│   │   ├── contexts/    # 認証コンテキスト
│   │   ├── pages/       # ページコンポーネント
│   │   └── types/       # TypeScript型定義
│   └── dist/            # ビルド成果物
├── docs/                # ドキュメント
│   ├── API_DOCUMENTATION.md
│   ├── VERCEL_DEPLOYMENT.md
│   ├── PDF_EXPORT_TESTING.md
│   ├── PROJECT_STATUS.md
│   └── ROADMAP.md
├── vercel.json          # Vercel設定
└── package.json         # ルートパッケージ設定
```

## デプロイ

### AWS EC2（推奨）
SQLiteをそのまま使用でき、本番環境に適しています。
- t3.small インスタンスで月額 $10-15
- 20-30人の同時接続に対応
- WALモードとパフォーマンス最適化済み

### Vercel
サーバーレス環境で動作させる場合。
詳細は [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) を参照してください。

## ドキュメント

- [API仕様書](docs/API_DOCUMENTATION.md)
- [プロジェクトステータス](docs/PROJECT_STATUS.md)
- [ロードマップ](docs/ROADMAP.md)
- [PDF出力テスト](docs/PDF_EXPORT_TESTING.md)
- [Vercelデプロイ手順](docs/VERCEL_DEPLOYMENT.md)

## 主な画面

1. **ログイン画面**: JWT認証によるセキュアなログイン
2. **業務実績画面**: 業務経験の一覧・追加・編集・削除
3. **データ可視化画面**: スキルの統計とグラフ表示
4. **プロフィール画面**: 個人情報、学歴、資格の管理
5. **さがす画面（管理者専用）**: 複数条件での人材検索
6. **管理者画面**: ユーザー管理と詳細情報の閲覧

## 開発時のビルド

```bash
# フロントエンドとバックエンドをビルド
npm run build

# 本番環境で起動
npm start
```

## ライセンス

MIT
