# GASからStreamlitへの移行計画

## 背景

現在のGAS実装ではページ更新に約5秒かかり、UXが悪い。
Streamlitへ移行してパフォーマンスを改善する。

---

## 技術スタック

| 項目 | 選定 |
|------|------|
| 言語 | Python 3.9+ |
| フレームワーク | Streamlit |
| ホスティング | Streamlit Community Cloud |
| ソースコード管理 | GitHub (Public Repository) |
| データベース | Google Spreadsheets（既存を継続） |
| 認証 | サービスアカウント + Streamlit Secrets |

---

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│      Streamlit Community Cloud          │
│  ┌─────────────────────────────────┐   │
│  │     Python + Streamlit          │   │
│  │  - gspread (スプレッドシート)   │   │
│  │  - plotly (グラフ)              │   │
│  └───────────────┬─────────────────┘   │
└──────────────────┼─────────────────────┘
                   │ API認証
                   ▼
        Google Spreadsheets (既存)
```

---

## 実装タスク

### Phase 1: 基盤構築

- [ ] プロジェクト初期化
  - [ ] `requirements.txt` 作成
  - [ ] `.streamlit/config.toml` 作成
  - [ ] `.gitignore` 更新
- [ ] サービスアカウント作成・設定
- [ ] gspreadでスプレッドシート接続確認

### Phase 2: 機能実装（ユーザー向け）

- [ ] 選手一覧ページ
  - [ ] 検索機能
  - [ ] フィルター（所属・カテゴリ）
- [ ] 選手プロフィールページ
  - [ ] 基本情報表示
  - [ ] 目標タイム表示
  - [ ] 自己ベスト表示
- [ ] パフォーマンスグラフ（Plotly）
- [ ] 記録入力フォーム

### Phase 3: 管理機能

- [ ] 選手追加・編集・削除
- [ ] チーム記録管理
- [ ] 区間シミュレーション（セレクトボックス方式）
- [ ] CSVインポート

### Phase 4: デプロイ

- [ ] Streamlit Community Cloudへデプロイ
- [ ] Secrets設定
- [ ] 動作確認・パフォーマンステスト

---

## ファイル構成（予定）

```
GAS_Ekiden-Report/
├── streamlit_app/
│   ├── app.py                 # メインアプリ
│   ├── pages/
│   │   ├── 1_選手一覧.py
│   │   ├── 2_選手詳細.py
│   │   ├── 3_記録入力.py
│   │   ├── 4_チーム記録.py
│   │   └── 5_シミュレーション.py
│   ├── utils/
│   │   ├── sheets.py          # スプレッドシート接続
│   │   ├── data.py            # データ処理
│   │   └── charts.py          # グラフ生成
│   └── .streamlit/
│       ├── config.toml        # UI設定
│       └── secrets.toml       # 認証情報（gitignore）
├── requirements.txt
├── .gitignore
└── docs/
    ├── MIGRATION_PLAN.md      # この文書
    ├── HANDOVER.md
    └── SPECIFICATION.md
```

---

## 認証設定手順

### 1. サービスアカウント作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト作成（または既存を使用）
3. 「APIとサービス」→「認証情報」
4. 「認証情報を作成」→「サービスアカウント」
5. 「鍵」タブ →「鍵を追加」→「JSON」→ ダウンロード

### 2. スプレッドシート共有

1. 対象スプレッドシートを開く
2. 「共有」→ サービスアカウントのメールアドレスを追加
3. 権限: 「編集者」

### 3. Streamlit Secrets設定

**ローカル開発**: `.streamlit/secrets.toml`
```toml
[gcp_service_account]
type = "service_account"
project_id = "your-project-id"
private_key_id = "xxx"
private_key = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
client_email = "xxx@xxx.iam.gserviceaccount.com"
client_id = "123456789"
auth_uri = "https://accounts.google.com/o/oauth2/auth"
token_uri = "https://oauth2.googleapis.com/token"
```

**Community Cloud**: ダッシュボードの「Secrets」セクションで設定

---

## 参考リンク

- 既存スプレッドシート: https://docs.google.com/spreadsheets/d/1Obbd41yFX_KPmag4foqtijxRpUgTZCzBq0vpqff-f3k/
- Streamlit公式: https://streamlit.io/
- gspread公式: https://docs.gspread.org/
