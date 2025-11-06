# Railwayへのデプロイ手順（推奨）

Railwayは、フルスタックアプリケーションのデプロイに最適で、SQLiteもサポートしています。
**このプロジェクトにはRailwayの使用を強く推奨します。**

## Railwayの利点

- ✅ SQLiteをそのまま使用可能
- ✅ 自動的にフロントエンドとバックエンドを構築
- ✅ 簡単な環境変数管理
- ✅ 無料枠あり（月$5のクレジット）
- ✅ GitHubとの自動連携
- ✅ ファイルストレージのサポート

## デプロイ手順

### 1. Railwayアカウントの作成

1. https://railway.app にアクセス
2. 「Start a New Project」をクリック
3. GitHubアカウントでサインアップ

### 2. プロジェクトの準備

#### 2.1 Procfileの作成

プロジェクトのルートディレクトリに `Procfile` を作成:

```
web: cd backend && npm start
```

#### 2.2 package.jsonの更新

ルートディレクトリに `package.json` を作成:

```json
{
  "name": "skill-management-system",
  "version": "1.0.0",
  "scripts": {
    "install-all": "cd backend && npm install && cd ../frontend && npm install",
    "build": "cd frontend && npm run build",
    "start": "cd backend && npm start"
  }
}
```

#### 2.3 backend/package.jsonにstartスクリプトを追加

`backend/package.json` を開き、scriptsセクションに以下を追加:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "start": "ts-node src/index.ts",
    "build": "tsc"
  }
}
```

### 3. GitHubリポジトリの作成

```bash
# プロジェクトのルートディレクトリで実行
cd "C:\Users\takahashi\Downloads\スキル管理システム"

# .gitignoreを作成
echo "node_modules
dist
*.sqlite
.env
uploads/*
!uploads/.gitkeep" > .gitignore

# Gitリポジトリを初期化
git init

# すべてのファイルを追加
git add .

# コミット
git commit -m "Initial commit for Railway deployment"

# GitHubでリポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. Railwayでのデプロイ

1. Railway ダッシュボードで「New Project」をクリック
2. 「Deploy from GitHub repo」を選択
3. リポジトリを選択
4. Railway が自動的にプロジェクトを検出

### 5. 環境変数の設定

Railwayプロジェクトの「Variables」タブで以下を設定:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-production-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### 6. ビルド設定

Railway は自動的に検出しますが、必要に応じて以下を設定:

**Backend Service:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Watch Paths**: `backend/**`

**Frontend Service (必要な場合):**
- **Build Command**: `cd frontend && npm install && npm run build`
- **Start Command**: `npx serve -s frontend/dist -p $PORT`
- **Watch Paths**: `frontend/**`

### 7. フロントエンドの設定

フロントエンドがバックエンドに接続できるように、環境変数を設定します。

`frontend/.env.production` を作成:

```
VITE_API_URL=https://your-railway-backend-url.up.railway.app
```

または、同じドメインでホスティングする場合は、相対パスを使用できます。

### 8. データベースの永続化

Railwayでは、デフォルトではファイルシステムが一時的です。
SQLiteデータベースを永続化するには:

1. Railwayプロジェクトで「Volumes」を追加
2. マウントパス: `/app/backend`
3. これでデータベースファイルが永続化されます

### 9. デプロイの実行

すべての設定が完了したら:

1. GitHubにプッシュすると自動的にデプロイされます
2. Railway ダッシュボードでビルドログを確認
3. デプロイが完了したら、提供されたURLにアクセス

## デプロイ後の確認

1. Railwayが提供するURLにアクセス
2. ログイン機能をテスト
3. データベース操作が正常に動作するか確認
4. ファイルアップロード機能をテスト

## トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドをテスト
cd backend
npm install
npm run build

cd ../frontend
npm install
npm run build
```

### データベース接続エラー

- データベースファイルのパスが正しいか確認
- Volumeが正しくマウントされているか確認

### 環境変数エラー

- Railwayの「Variables」タブですべての環境変数が設定されているか確認
- 変数名にスペースや特殊文字が含まれていないか確認

## アップデート方法

```bash
# コードを変更後
git add .
git commit -m "Update: description of changes"
git push origin main

# Railwayが自動的に再デプロイします
```

## コスト

- **無料枠**: 月$5のクレジット（小規模アプリに十分）
- **実行時間**: 計算時間に基づいて課金
- **ストレージ**: ボリュームストレージは別途課金

## まとめ

Railway は以下の理由でこのプロジェクトに最適です:

1. ✅ SQLiteをそのまま使用可能（データベース移行不要）
2. ✅ 簡単なセットアップ（5-10分で完了）
3. ✅ 自動デプロイ（GitHubプッシュで自動更新）
4. ✅ 無料枠あり
5. ✅ ファイルアップロード機能もサポート

**次のステップ**: 上記の手順に従ってGitHubリポジトリを作成し、Railwayでデプロイしてください。
