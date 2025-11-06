# API仕様書

## ベースURL

```
http://localhost:3000/api
```

本番環境では適切なドメインに置き換えてください。

## 認証

ほとんどのエンドポイントはJWT認証が必要です。認証が必要なエンドポイントには、リクエストヘッダーに以下を含める必要があります:

```
Authorization: Bearer <JWT_TOKEN>
```

JWTトークンは、ログインエンドポイント（`POST /auth/login`）から取得できます。

## エラーレスポンス

すべてのエンドポイントは、エラー時に以下の形式でレスポンスを返します:

```json
{
  "error": "エラーメッセージ",
  "details": ["詳細1", "詳細2"]  // バリデーションエラーの場合のみ
}
```

### HTTPステータスコード

- `200 OK` - 成功
- `201 Created` - リソース作成成功
- `400 Bad Request` - バリデーションエラー
- `401 Unauthorized` - 認証エラー
- `404 Not Found` - リソースが見つからない
- `500 Internal Server Error` - サーバーエラー

---

## 認証API

### POST /auth/register

新規ユーザーを登録します。

**認証**: 不要

**リクエストボディ**:
```json
{
  "username": "string (必須)",
  "password": "string (必須)",
  "email": "string (オプション)",
  "full_name": "string (オプション)"
}
```

**レスポンス** (201 Created):
```json
{
  "user": {
    "id": 1,
    "username": "yamada_taro",
    "email": "yamada@example.com",
    "full_name": "山田太郎"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**エラー**:
- `400`: ユーザー名が既に存在する場合

**例**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_user",
    "password": "password123",
    "email": "user@example.com",
    "full_name": "新規ユーザー"
  }'
```

---

### POST /auth/login

ユーザーログインを行い、JWTトークンを取得します。

**認証**: 不要

**リクエストボディ**:
```json
{
  "username": "string (必須)",
  "password": "string (必須)"
}
```

**レスポンス** (200 OK):
```json
{
  "user": {
    "id": 1,
    "username": "yamada_taro",
    "email": "yamada@example.com",
    "full_name": "山田太郎"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**エラー**:
- `401`: ユーザー名またはパスワードが正しくない場合

**例**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "yamada_taro",
    "password": "password123"
  }'
```

---

### GET /auth/me

現在ログイン中のユーザー情報を取得します。

**認証**: 必須

**レスポンス** (200 OK):
```json
{
  "user": {
    "id": 1,
    "username": "yamada_taro",
    "email": "yamada@example.com",
    "full_name": "山田太郎"
  }
}
```

**エラー**:
- `401`: 認証トークンが無効または期限切れ

**例**:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 業務実績API

### GET /work-experiences

ログイン中のユーザーの業務実績一覧を取得します。

**認証**: 必須

**レスポンス** (200 OK):
```json
{
  "workExperiences": [
    {
      "id": 1,
      "user_id": 1,
      "start_date": "2021-04",
      "end_date": "2023-03",
      "industry": "金融",
      "system_name": "オンラインバンキングシステム",
      "requirement_analysis": 1,
      "basic_design": 1,
      "detail_design": 0,
      "development": 1,
      "testing": 1,
      "operation": 0,
      "environment": "AWS, Docker, Kubernetes",
      "languages": "Java, Spring Boot, PostgreSQL",
      "created_at": "2025-11-06 00:34:10",
      "updated_at": "2025-11-06 00:34:10"
    }
  ]
}
```

**注意**: 業務実績は`start_date`の昇順でソートされます。

**例**:
```bash
curl -X GET http://localhost:3000/api/work-experiences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET /work-experiences/:id

特定の業務実績の詳細を取得します。

**認証**: 必須

**パラメータ**:
- `id` (number): 業務実績ID

**レスポンス** (200 OK):
```json
{
  "workExperience": {
    "id": 1,
    "user_id": 1,
    "start_date": "2021-04",
    "end_date": "2023-03",
    "industry": "金融",
    "system_name": "オンラインバンキングシステム",
    "requirement_analysis": 1,
    "basic_design": 1,
    "detail_design": 0,
    "development": 1,
    "testing": 1,
    "operation": 0,
    "environment": "AWS, Docker, Kubernetes",
    "languages": "Java, Spring Boot, PostgreSQL",
    "created_at": "2025-11-06 00:34:10",
    "updated_at": "2025-11-06 00:34:10"
  }
}
```

**エラー**:
- `404`: 業務実績が見つからない、または他のユーザーの業務実績にアクセスしようとした場合

**例**:
```bash
curl -X GET http://localhost:3000/api/work-experiences/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### POST /work-experiences

新しい業務実績を作成します。

**認証**: 必須

**リクエストボディ**:
```json
{
  "start_date": "string (必須, YYYY-MM形式)",
  "end_date": "string | null (オプション, YYYY-MM形式)",
  "industry": "string (オプション)",
  "system_name": "string (オプション)",
  "requirement_analysis": "number (0 or 1, デフォルト: 0)",
  "basic_design": "number (0 or 1, デフォルト: 0)",
  "detail_design": "number (0 or 1, デフォルト: 0)",
  "development": "number (0 or 1, デフォルト: 0)",
  "testing": "number (0 or 1, デフォルト: 0)",
  "operation": "number (0 or 1, デフォルト: 0)",
  "environment": "string (オプション)",
  "languages": "string (オプション)"
}
```

**バリデーションルール**:
- `start_date`: 必須、YYYY-MM形式
- `end_date`: YYYY-MM形式、start_date以降の日付
- 各フラグ（requirement_analysis等）: 0または1

**レスポンス** (201 Created):
```json
{
  "workExperience": {
    "id": 5,
    "user_id": 1,
    "start_date": "2023-06",
    "end_date": null,
    "industry": "教育",
    "system_name": "オンライン学習プラットフォーム",
    "requirement_analysis": 1,
    "basic_design": 1,
    "detail_design": 1,
    "development": 1,
    "testing": 1,
    "operation": 0,
    "environment": "GCP, Cloud Run, Firebase",
    "languages": "TypeScript, Next.js, Firestore",
    "created_at": "2025-11-06 03:00:00",
    "updated_at": "2025-11-06 03:00:00"
  }
}
```

**エラー**:
- `400`: バリデーションエラー（詳細は`details`配列に含まれる）

**例**:
```bash
curl -X POST http://localhost:3000/api/work-experiences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "start_date": "2023-06",
    "end_date": null,
    "industry": "教育",
    "system_name": "オンライン学習プラットフォーム",
    "requirement_analysis": 1,
    "basic_design": 1,
    "detail_design": 1,
    "development": 1,
    "testing": 1,
    "operation": 0,
    "environment": "GCP, Cloud Run, Firebase",
    "languages": "TypeScript, Next.js, Firestore"
  }'
```

---

### PUT /work-experiences/:id

業務実績を更新します。

**認証**: 必須

**パラメータ**:
- `id` (number): 業務実績ID

**リクエストボディ**:
```json
{
  "start_date": "string (必須, YYYY-MM形式)",
  "end_date": "string | null (オプション, YYYY-MM形式)",
  "industry": "string (オプション)",
  "system_name": "string (オプション)",
  "requirement_analysis": "number (0 or 1)",
  "basic_design": "number (0 or 1)",
  "detail_design": "number (0 or 1)",
  "development": "number (0 or 1)",
  "testing": "number (0 or 1)",
  "operation": "number (0 or 1)",
  "environment": "string (オプション)",
  "languages": "string (オプション)"
}
```

**レスポンス** (200 OK):
```json
{
  "workExperience": {
    "id": 5,
    "user_id": 1,
    "start_date": "2023-06",
    "end_date": "2024-12",
    "industry": "教育",
    "system_name": "オンライン学習プラットフォーム",
    "requirement_analysis": 1,
    "basic_design": 1,
    "detail_design": 1,
    "development": 1,
    "testing": 1,
    "operation": 1,
    "environment": "GCP, Cloud Run, Firebase",
    "languages": "TypeScript, Next.js, Firestore",
    "created_at": "2025-11-06 03:00:00",
    "updated_at": "2025-11-06 03:05:00"
  }
}
```

**エラー**:
- `400`: バリデーションエラー
- `404`: 業務実績が見つからない、または他のユーザーの業務実績を更新しようとした場合

**例**:
```bash
curl -X PUT http://localhost:3000/api/work-experiences/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "start_date": "2023-06",
    "end_date": "2024-12",
    "industry": "教育",
    "system_name": "オンライン学習プラットフォーム",
    "requirement_analysis": 1,
    "basic_design": 1,
    "detail_design": 1,
    "development": 1,
    "testing": 1,
    "operation": 1,
    "environment": "GCP, Cloud Run, Firebase",
    "languages": "TypeScript, Next.js, Firestore"
  }'
```

---

### DELETE /work-experiences/:id

業務実績を削除します。

**認証**: 必須

**パラメータ**:
- `id` (number): 業務実績ID

**レスポンス** (200 OK):
```json
{
  "message": "Work experience deleted successfully"
}
```

**エラー**:
- `404`: 業務実績が見つからない、または他のユーザーの業務実績を削除しようとした場合

**例**:
```bash
curl -X DELETE http://localhost:3000/api/work-experiences/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ユーザーAPI

### GET /users/profile

ログイン中のユーザーのプロフィールを取得します。

**認証**: 必須

**レスポンス** (200 OK):
```json
{
  "profile": {
    "id": 1,
    "user_id": 1,
    "age": 28,
    "address": "東京都渋谷区",
    "education": "東京大学 工学部",
    "major": "情報工学科",
    "certifications": "基本情報技術者、応用情報技術者",
    "created_at": "2025-11-06 00:34:10",
    "updated_at": "2025-11-06 00:34:10"
  }
}
```

**エラー**:
- `404`: プロフィールが見つからない

**例**:
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### PUT /users/profile

ユーザープロフィールを更新します。

**認証**: 必須

**リクエストボディ**:
```json
{
  "age": "number | null (オプション, 0-150)",
  "address": "string (オプション)",
  "education": "string (オプション)",
  "major": "string (オプション)",
  "certifications": "string (オプション)"
}
```

**バリデーションルール**:
- `age`: 0〜150の範囲

**レスポンス** (200 OK):
```json
{
  "profile": {
    "id": 1,
    "user_id": 1,
    "age": 29,
    "address": "東京都新宿区",
    "education": "東京大学 工学部",
    "major": "情報工学科",
    "certifications": "基本情報技術者、応用情報技術者、AWS認定",
    "created_at": "2025-11-06 00:34:10",
    "updated_at": "2025-11-06 03:05:00"
  }
}
```

**エラー**:
- `400`: バリデーションエラー（詳細は`details`配列に含まれる）
- `404`: プロフィールが見つからない

**例**:
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "age": 29,
    "address": "東京都新宿区",
    "education": "東京大学 工学部",
    "major": "情報工学科",
    "certifications": "基本情報技術者、応用情報技術者、AWS認定"
  }'
```

---

## レート制限

現在、レート制限は実装されていません。本番環境では適切なレート制限の実装を推奨します。

## CORS

開発環境では、すべてのオリジンからのリクエストを許可しています。本番環境では、フロントエンドのドメインのみを許可するように設定してください。

## バージョニング

現在、APIバージョニングは実装されていません。将来的には`/api/v1/`のようなバージョニングを導入する予定です。

---

**最終更新**: 2025年11月6日
