# Vercelへのデプロイ手順

このドキュメントでは、スキル管理システムをVercelにデプロイする手順を説明します。

## 重要な注意事項

このアプリケーションは現在**SQLite**を使用していますが、Vercelのサーバーレス環境ではSQLiteは動作しません。
そのため、以下のいずれかのデータベースサービスへの移行が必要です：

1. **Vercel Postgres** (推奨) - Vercelが提供するPostgreSQLサービス
2. **PlanetScale** - MySQL互換のサーバーレスデータベース
3. **Supabase** - PostgreSQLベースのBaaS
4. **Neon** - サーバーレスPostgreSQL

## 前提条件

- GitHubアカウント
- Vercelアカウント (https://vercel.com)
- このプロジェクトがGitHubリポジトリにプッシュされていること

## デプロイ手順

### 1. GitHubリポジトリの準備

```bash
# プロジェクトのルートディレクトリで実行
cd "C:\Users\takahashi\Downloads\スキル管理システム"

# Gitリポジトリを初期化（まだの場合）
git init

# すべてのファイルを追加
git add .

# コミット
git commit -m "Initial commit for Vercel deployment"

# GitHubリポジトリを作成後、リモートを追加
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# プッシュ
git push -u origin main
```

### 2. Vercelプロジェクトのセットアップ

1. https://vercel.com にアクセスしてログイン
2. 「Add New」→「Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定:

```
NODE_ENV=production
JWT_SECRET=your-production-secret-key-change-this
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=your-database-connection-string
```

### 4. データベースの移行

#### オプションA: Vercel Postgresを使用する場合

1. Vercelダッシュボードで「Storage」タブを開く
2. 「Create Database」→「Postgres」を選択
3. データベース名を入力して作成
4. 接続情報が自動的に環境変数に追加されます

#### データベース移行スクリプトの実行

SQLiteからPostgreSQLへの移行が必要です。以下のスクリプトを作成して実行してください：

```bash
# backend/src/database/migrate-to-postgres.sql を作成
# 既存のschema.sqlをPostgreSQL用に変換
```

**主な変更点:**
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `TEXT` → `VARCHAR` または `TEXT`
- `BOOLEAN` → `BOOLEAN`
- `DATETIME` → `TIMESTAMP`

### 5. バックエンドAPIの調整

現在のバックエンドはExpressサーバーとして動作していますが、Vercelのサーバーレス関数として動作させる必要があります。

`backend/api/index.ts` を作成:

```typescript
import express from 'express';
import cors from 'cors';
// 既存のルートをインポート

const app = express();

app.use(cors());
app.use(express.json());

// 既存のルートを設定
// app.use('/api/auth', authRouter);
// など...

export default app;
```

### 6. フロントエンドのAPI設定を更新

`frontend/src/api/axiosConfig.ts` でAPI URLを環境変数から取得するように変更:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

`.env.production` を作成:
```
VITE_API_URL=https://your-vercel-app.vercel.app
```

## デプロイ後の確認

1. Vercelが提供するURLにアクセス
2. ログイン機能が動作するか確認
3. データベース接続が正常か確認
4. すべてのAPI エンドポイントが動作するか確認

## トラブルシューティング

### エラー: "Module not found"
- `package.json` に必要な依存関係がすべて含まれているか確認
- `npm install` を実行してから再度コミット

### データベース接続エラー
- 環境変数 `DATABASE_URL` が正しく設定されているか確認
- データベースのマイグレーションが完了しているか確認

### ファイルアップロードエラー
- Vercelのサーバーレス関数では永続的なファイルストレージは使用できません
- ファイルアップロード機能には **Vercel Blob** または **AWS S3** などのクラウドストレージを使用してください

## 代替案: 別のホスティングサービス

SQLiteを使い続けたい場合や、より柔軟な環境が必要な場合は、以下のサービスを検討してください:

1. **Railway** (https://railway.app) - SQLiteをサポート、自動デプロイ
2. **Render** (https://render.com) - 無料プラン有り、SQLiteをサポート
3. **Fly.io** (https://fly.io) - エッジコンピューティング、SQLiteをサポート
4. **AWS Lightsail** - VPS、完全な制御

これらのサービスでは、現在のSQLite設定をそのまま使用できます。

## まとめ

Vercelへのデプロイには以下の作業が必要です:

1. ✅ GitHubリポジトリの作成とプッシュ
2. ⚠️ SQLiteからPostgreSQLへのデータベース移行
3. ⚠️ バックエンドAPIのサーバーレス関数化
4. ✅ 環境変数の設定
5. ⚠️ ファイルアップロード機能のクラウドストレージ対応

**推奨**: 開発の手間を考慮すると、**Railway** や **Render** の使用をお勧めします。
これらのサービスでは現在の構成をほぼそのまま使用でき、デプロイが簡単です。
