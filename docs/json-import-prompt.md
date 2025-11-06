# 業務実績JSONインポート用プロンプトテンプレート

このドキュメントは、PDFやExcelファイルから業務実績データを抽出し、システムにインポート可能なJSON形式に変換するためのプロンプトテンプレートです。

## 基本プロンプト

```
添付したPDF/Excelファイルから業務実績データを抽出し、以下のJSON形式に変換してください。

【必須フィールド】
- start_date: 開始年月 (YYYY-MM形式)

【オプションフィールド】
- end_date: 終了年月 (YYYY-MM形式、現在進行中の場合はnull)
- industry: 業種 (文字列)
- industry_id: 業種ID (数値、未設定の場合はnull)
- customer_name: お客様名 (文字列)
- system_name: システム名/案件名 (文字列)
- team_size: チーム規模 (数値)
- role: 役割 (文字列)
- requirement_analysis: 要件定義を担当したか (true/false)
- basic_design: 基本設計を担当したか (true/false)
- detail_design: 詳細設計を担当したか (true/false)
- development: 開発を担当したか (true/false)
- testing: テストを担当したか (true/false)
- operation: 運用を担当したか (true/false)
- environment_ids: 開発環境のIDリスト (数値の配列)
- language_ids: 開発言語・技術のIDリスト (数値の配列)
- description: 業務内容の詳細説明 (文字列)

【出力形式】
以下のJSON配列形式で出力してください。コードブロックで囲まず、JSONのみを出力してください。

[
  {
    "start_date": "2023-04",
    "end_date": "2024-03",
    "industry": "金融",
    "industry_id": null,
    "customer_name": "○○銀行",
    "system_name": "勘定系システム刷新",
    "team_size": 15,
    "role": "開発リーダー",
    "requirement_analysis": true,
    "basic_design": true,
    "detail_design": true,
    "development": true,
    "testing": true,
    "operation": false,
    "environment_ids": [],
    "language_ids": [],
    "description": "勘定系システムの刷新プロジェクトにおいて、開発リーダーとして参画。要件定義から開発、テストまでの全工程を担当。"
  }
]

【注意事項】
1. 日付は必ずYYYY-MM形式にしてください（例: "2023-04"）
2. 担当工程（requirement_analysis等）は、明示的に記載がある場合のみtrueとし、不明な場合はfalseとしてください
3. チーム規模は数値で記載してください（例: 10、15）
4. environment_idsとlanguage_idsは、現時点では空配列[]としてください（後でシステム上で設定可能）
5. industry_idは、業種マスタが未設定の場合はnullとしてください
6. 情報が不足している項目はnullまたはfalseを設定してください
7. 複数の業務実績がある場合は、配列内に複数のオブジェクトを含めてください
8. 時系列順（古い順）に並べてください
```

## 詳細プロンプト（より正確な抽出が必要な場合）

```
添付したPDF/Excelファイルは、エンジニアの業務経歴書です。これを解析して、業務実績データをJSON形式で抽出してください。

【解析の手順】
1. ファイル内の各プロジェクト/案件を特定する
2. 各プロジェクトについて、以下の情報を抽出する：
   - 期間（開始年月と終了年月）
   - 業種/業界（金融、製造、流通、通信、官公庁など）
   - お客様名/顧客名
   - プロジェクト名/システム名
   - チーム規模/人数
   - 担当した役割（開発者、リーダー、PMなど）
   - 担当した工程（要件定義、基本設計、詳細設計、開発、テスト、運用）
   - 使用した技術/言語/環境
   - 業務内容の詳細

【日付の抽出ルール】
- "2023年4月～2024年3月" → start_date: "2023-04", end_date: "2024-03"
- "2023/4～2024/3" → start_date: "2023-04", end_date: "2024-03"
- "2023.04-2024.03" → start_date: "2023-04", end_date: "2024-03"
- "2023年4月～現在" → start_date: "2023-04", end_date: null
- "2023年4月～" → start_date: "2023-04", end_date: null

【工程の判定ルール】
以下のようなキーワードがあればtrueとしてください：
- 要件定義: "要件定義"、"要求定義"、"RD"
- 基本設計: "基本設計"、"外部設計"、"BD"
- 詳細設計: "詳細設計"、"内部設計"、"DD"
- 開発: "開発"、"実装"、"製造"、"コーディング"、"PG"
- テスト: "テスト"、"試験"、"UT"、"IT"、"ST"
- 運用: "運用"、"保守"、"維持管理"

【技術情報の処理】
- 現時点では、environment_idsとlanguage_idsは空配列[]としてください
- 使用技術は、description欄に含めてください

【出力フォーマット】
JSONのみを出力してください。説明文やマークダウンのコードブロック記号は不要です。

以下の形式で出力：
[
  {
    "start_date": "YYYY-MM",
    "end_date": "YYYY-MM" or null,
    "industry": "業種名" or null,
    "industry_id": null,
    "customer_name": "顧客名" or null,
    "system_name": "システム名" or null,
    "team_size": 数値 or null,
    "role": "役割" or null,
    "requirement_analysis": true or false,
    "basic_design": true or false,
    "detail_design": true or false,
    "development": true or false,
    "testing": true or false,
    "operation": true or false,
    "environment_ids": [],
    "language_ids": [],
    "description": "詳細な業務内容の説明"
  }
]
```

## 業種マスタ参照用プロンプト（オプション）

システムに登録されている業種マスタを参照する場合：

```
【業種マスタ】
以下の業種が登録されています。該当する場合は、industry_idに対応するIDを設定してください：

1: 金融
2: 製造
3: 流通・小売
4: 通信・放送
5: 官公庁・自治体
6: 医療・ヘルスケア
7: 教育
8: 運輸・物流
9: エネルギー・インフラ
10: サービス
11: その他

例：顧客が銀行の場合 → "industry": "金融", "industry_id": 1
```

## 使用例

### Claude/Geminiでの使用方法

1. **ファイルを添付**
   - PDFまたはExcelファイルをアップロード

2. **プロンプトを入力**
   - 上記の「基本プロンプト」または「詳細プロンプト」をコピー＆ペースト

3. **出力されたJSONを保存**
   - 出力されたJSONをコピー
   - テキストエディタに貼り付け
   - `.json`拡張子で保存（例: `work_experiences.json`）

4. **システムにインポート**
   - 管理者としてログイン
   - 対象ユーザーの詳細画面を開く
   - 「JSONインポート」ボタンをクリック
   - 保存したJSONファイルを選択

## トラブルシューティング

### よくあるエラーと対処法

**エラー: "JSONファイルは配列形式である必要があります"**
- 原因: JSON全体が`[]`で囲まれていない
- 対処: `{...}`を`[{...}]`に修正

**エラー: "項目X: 開始年月は必須です"**
- 原因: start_dateが空または不正な形式
- 対処: 必ずYYYY-MM形式で設定

**エラー: "このユーザーには既に業務実績が登録されています"**
- 原因: ユーザーが既にデータを持っている
- 対処: インポートは業務実績が0件のユーザーにのみ可能です

### JSON検証

インポート前に以下のサイトでJSONの妥当性を確認できます：
- [JSONLint](https://jsonlint.com/)
- [JSON Formatter & Validator](https://jsonformatter.curiousconcept.com/)

## サンプルJSONファイル

```json
[
  {
    "start_date": "2022-04",
    "end_date": "2023-03",
    "industry": "金融",
    "industry_id": 1,
    "customer_name": "ABC銀行",
    "system_name": "インターネットバンキングシステム",
    "team_size": 20,
    "role": "プログラマ",
    "requirement_analysis": false,
    "basic_design": false,
    "detail_design": true,
    "development": true,
    "testing": true,
    "operation": false,
    "environment_ids": [],
    "language_ids": [],
    "description": "インターネットバンキングシステムの開発において、詳細設計から開発、テストまでを担当。主にログイン機能と振込機能の実装を担当した。"
  },
  {
    "start_date": "2023-04",
    "end_date": "2024-03",
    "industry": "製造",
    "industry_id": 2,
    "customer_name": "XYZ製作所",
    "system_name": "生産管理システム",
    "team_size": 15,
    "role": "開発リーダー",
    "requirement_analysis": true,
    "basic_design": true,
    "detail_design": true,
    "development": true,
    "testing": true,
    "operation": false,
    "environment_ids": [],
    "language_ids": [],
    "description": "生産管理システムの刷新プロジェクトにおいて、開発リーダーとして参画。要件定義から開発、テストまでの全工程を担当し、チームメンバー5名をリードした。"
  },
  {
    "start_date": "2024-04",
    "end_date": null,
    "industry": "通信・放送",
    "industry_id": 4,
    "customer_name": "株式会社テレコム",
    "system_name": "顧客管理システム",
    "team_size": 10,
    "role": "テックリード",
    "requirement_analysis": true,
    "basic_design": true,
    "detail_design": true,
    "development": true,
    "testing": true,
    "operation": true,
    "environment_ids": [],
    "language_ids": [],
    "description": "通信事業者向け顧客管理システムの開発・運用。アーキテクチャ設計から運用まで一貫して担当。マイクロサービスアーキテクチャを採用し、スケーラビリティの高いシステムを構築。"
  }
]
```

## 補足情報

### environment_idsとlanguage_idsの設定方法

JSONインポート後、システム上で以下の手順で設定できます：

1. インポート完了後、各業務実績の編集画面を開く
2. 「開発環境」「開発言語・技術」セクションで該当する技術を選択
3. 保存

または、事前にマスタデータを確認してIDを直接JSONに記載することも可能です。

### マスタデータの確認方法

システムにログイン後、開発者ツールのコンソールで以下を実行：

```javascript
// 開発環境マスタの確認
fetch('/api/master/environments', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
}).then(r => r.json()).then(console.log)

// 開発言語マスタの確認
fetch('/api/master/languages', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
}).then(r => r.json()).then(console.log)
```
