# 縦断駅伝選手名簿管理システム - 詳細仕様書

## 目次

1. [システム概要](#1-システム概要)
2. [システムアーキテクチャ](#2-システムアーキテクチャ)
3. [データベース設計](#3-データベース設計)
4. [GASバックエンド仕様](#4-gasバックエンド仕様)
5. [Webフロントエンド仕様](#5-webフロントエンド仕様)
6. [Streamlitアプリケーション仕様](#6-streamlitアプリケーション仕様)
7. [API仕様](#7-api仕様)
8. [デプロイメント仕様](#8-デプロイメント仕様)
9. [セキュリティ仕様](#9-セキュリティ仕様)

---

## 1. システム概要

### 1.1 システム名
縦断駅伝選手名簿管理システム

### 1.2 システムの目的
駅伝チームの選手情報、記録、目標タイムを一元管理し、区間オーダーのシミュレーションや記録分析を行うためのWebアプリケーション

### 1.3 主要機能
| 機能カテゴリ | 機能名 | 説明 |
|-------------|--------|------|
| 選手管理 | 選手一覧表示 | 登録選手の一覧をカード形式で表示 |
| 選手管理 | 選手追加/編集 | 選手情報の登録・更新 |
| 選手管理 | 選手削除 | 論理削除による選手の無効化 |
| 選手管理 | CSV一括登録 | CSVファイルからの一括インポート |
| 記録管理 | 記録登録 | 大会記録の追加 |
| 記録管理 | 記録一覧表示 | 選手別の記録履歴表示 |
| 記録管理 | 自己ベスト計算 | 種目別ベストタイムの自動算出 |
| 分析機能 | 記録推移グラフ | 時系列での記録変化をグラフ化 |
| 分析機能 | 目標達成度計算 | 目標タイムとの差分を表示 |
| シミュレーション | 区間オーダー編成 | ドラッグ&ドロップで区間配置 |
| シミュレーション | 総合タイム予測 | 配置に基づく予想タイム計算 |
| シミュレーション | シミュレーション保存 | 編成案の保存・読み込み |

### 1.4 対象ユーザー
| ユーザー種別 | 説明 | 権限 |
|-------------|------|------|
| 一般ユーザー | チームメンバー、マネージャー | 閲覧、記録追加、目標編集 |
| 管理者 | 監督、コーチ | 全機能（選手追加/編集/削除含む） |

---

## 2. システムアーキテクチャ

### 2.1 全体構成

```
┌─────────────────────────────────────────────────────────────────┐
│                        クライアント層                             │
├─────────────────────┬───────────────────────────────────────────┤
│   GAS Webアプリ      │         Streamlit アプリ                   │
│   (HTML/CSS/JS)     │         (Python)                          │
│   - index.html      │         - app.py                          │
│   - simulation.html │         - pages/1_選手一覧.py              │
│   - csv.html        │         - pages/2_選手詳細.py              │
│   - javascript.html │         - pages/3_記録入力.py              │
│   - stylesheet.html │                                           │
└──────────┬──────────┴────────────────┬──────────────────────────┘
           │                           │
           │ google.script.run         │ gspread API
           ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      バックエンド層                               │
├─────────────────────┬───────────────────────────────────────────┤
│   Google Apps Script │         Google Cloud Run                  │
│   (コード.js)        │         (Dockerコンテナ)                   │
└──────────┬──────────┴────────────────┬──────────────────────────┘
           │                           │
           │ SpreadsheetApp            │ Google Sheets API
           ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       データ層                                    │
│              Google Spreadsheet (データベース)                    │
│   ┌─────────┐  ┌─────────┐  ┌───────────┐  ┌────────────┐       │
│   │ Players │  │ Records │  │TeamRecords│  │Simulations │       │
│   └─────────┘  └─────────┘  └───────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技術スタック

| レイヤー | 技術 | バージョン/仕様 |
|---------|------|----------------|
| フロントエンド (GAS) | HTML5, CSS3, JavaScript | ES6+ |
| フロントエンド (Streamlit) | Streamlit | >= 1.28.0 |
| バックエンド | Google Apps Script | V8 Runtime |
| データベース | Google Spreadsheet | - |
| 認証 | OAuth 2.0 | Google認証 |
| グラフ描画 | Chart.js (GAS) / Plotly (Streamlit) | - |
| ドラッグ&ドロップ | SortableJS | 1.15.0 |
| コンテナ | Docker | Python 3.9-slim |
| ホスティング | GAS Web App / Cloud Run / Hugging Face Spaces | - |

### 2.3 ファイル構成

```
GAS_Ekiden-Report/
├── .clasp.json                 # clasp設定（GASデプロイ用）
├── appsscript.json             # GASプロジェクト設定
├── コード.js                    # GASメインコード（サーバーサイド）
├── index.html                  # メインページHTML
├── javascript.html             # JavaScript（クライアントサイド）
├── stylesheet.html             # CSS スタイルシート
├── simulation.html             # シミュレーションページ
├── csv.html                    # CSV登録ページ
├── ekiden_profile_v1.html      # プロフィールデザイン（参考用）
├── Dockerfile                  # Cloud Run用Dockerfile
├── README.md                   # プロジェクト説明
├── docs/
│   ├── SPECIFICATION.md        # 簡易仕様書
│   ├── HANDOVER.md             # 引継ぎ書
│   └── MIGRATION_PLAN.md       # 移行計画
└── streamlit_app/
    ├── app.py                  # Streamlitメインアプリ
    ├── requirements.txt        # Python依存パッケージ
    ├── .streamlit/
    │   └── config.toml         # Streamlit設定
    ├── pages/
    │   ├── 1_選手一覧.py        # 選手一覧ページ
    │   ├── 2_選手詳細.py        # 選手詳細ページ
    │   └── 3_記録入力.py        # 記録入力ページ
    └── utils/
        ├── __init__.py
        ├── sheets.py           # Spreadsheet接続モジュール
        └── style.py            # スタイル設定
```

---

## 3. データベース設計

### 3.1 スプレッドシート情報

| 項目 | 値 |
|------|-----|
| スプレッドシートID | `1Obbd41yFX_KPmag4foqtijxRpUgTZCzBq0vpqff-f3k` |
| タイムゾーン | Asia/Tokyo |

### 3.2 Players シート（選手マスタ）

選手の基本情報と目標タイムを管理

| # | カラム名 | 日本語名 | データ型 | 必須 | 説明 |
|---|---------|----------|---------|------|------|
| 1 | id | 選手ID | UUID | ○ | 一意識別子（自動生成） |
| 2 | registration_number | 登録番号 | String | ○ | チーム内登録番号（重複不可） |
| 3 | name | 氏名 | String | ○ | 選手氏名 |
| 4 | affiliation | 所属 | String | | 所属チーム/学校名 |
| 5 | category | 学年/カテゴリ | String | | 中学生/高校生/大学生/一般/30代等 |
| 6 | target_1500m | 1500m目標 | Time String | | 目標タイム（例: "4:10"） |
| 7 | target_3000m | 3000m目標 | Time String | | 目標タイム（例: "9:00"） |
| 8 | target_5000m | 5000m目標 | Time String | | 目標タイム（例: "15:30"） |
| 9 | target_10000m | 10000m目標 | Time String | | 目標タイム（例: "32:00"） |
| 10 | target_half | ハーフ目標 | Time String | | 目標タイム（例: "1:10:00"） |
| 11 | target_full | フル目標 | Time String | | 目標タイム（例: "2:30:00"） |
| 12 | comment | 一言/備考 | Text | | 選手のコメント・備考 |
| 13 | is_deleted | 削除フラグ | Boolean | | true = 論理削除 |
| 14 | created_at | 作成日時 | DateTime | ○ | レコード作成日時 |
| 15 | updated_at | 更新日時 | DateTime | ○ | 最終更新日時 |

### 3.3 Records シート（個人記録）

選手ごとの大会記録を管理

| # | カラム名 | 日本語名 | データ型 | 必須 | 説明 |
|---|---------|----------|---------|------|------|
| 1 | record_id | 記録ID | UUID | ○ | 一意識別子（自動生成） |
| 2 | player_id | 選手ID | UUID | ○ | Playersシートへの外部キー |
| 3 | race_name | 大会名 | String | ○ | 大会・記録会の名称 |
| 4 | date | 開催日 | Date | ○ | 大会開催日 |
| 5 | section | 区間/種目 | String | ○ | 1500m/3000m/5000m/10000m/ハーフ/フル/1区〜6区等 |
| 6 | time | 記録 | Time String | ○ | タイム（例: "15:30" or "1:05:30"） |
| 7 | memo | 備考 | Text | | コンディション・感想等 |
| 8 | created_at | 作成日時 | DateTime | ○ | レコード作成日時 |
| 9 | updated_at | 更新日時 | DateTime | ○ | 最終更新日時 |

### 3.4 TeamRecords シート（チーム記録）

チーム全体の駅伝記録を管理

| # | カラム名 | 日本語名 | データ型 | 必須 | 説明 |
|---|---------|----------|---------|------|------|
| 1 | team_record_id | チーム記録ID | UUID | ○ | 一意識別子（自動生成） |
| 2 | race_name | 大会名 | String | ○ | 駅伝大会名 |
| 3 | date | 開催日 | Date | ○ | 大会開催日 |
| 4 | total_time | 総合記録 | Time String | | 総合タイム |
| 5 | rank | 順位 | Number | | 大会順位 |
| 6 | memo | 備考 | Text | | 備考 |
| 7 | created_at | 作成日時 | DateTime | ○ | レコード作成日時 |
| 8 | updated_at | 更新日時 | DateTime | ○ | 最終更新日時 |

### 3.5 Simulations シート（シミュレーション）

区間オーダーのシミュレーション案を保存

| # | カラム名 | 日本語名 | データ型 | 必須 | 説明 |
|---|---------|----------|---------|------|------|
| 1 | sim_id | シミュレーションID | UUID | ○ | 一意識別子（自動生成） |
| 2 | title | 案の名称 | String | ○ | シミュレーション名（例: "Aチーム案"） |
| 3 | created_at | 作成日時 | DateTime | ○ | 作成日時 |
| 4 | order_json | オーダーデータ | JSON String | ○ | 区間配置データ（JSON形式） |
| 5 | updated_at | 更新日時 | DateTime | ○ | 最終更新日時 |

#### order_json のデータ構造

```json
[
  {
    "section": 1,
    "player_id": "uuid-xxx",
    "player_name": "山田太郎",
    "distance": "10"
  },
  {
    "section": 2,
    "player_id": "uuid-yyy",
    "player_name": "佐藤花子",
    "distance": "5"
  }
]
```

---

## 4. GASバックエンド仕様

### 4.1 定数定義

```javascript
const SPREADSHEET_ID = '1Obbd41yFX_KPmag4foqtijxRpUgTZCzBq0vpqff-f3k';

const SHEET_DEFINITIONS = {
  Players: { name: 'Players', headers: [...], headerLabels: [...] },
  Records: { name: 'Records', headers: [...], headerLabels: [...] },
  TeamRecords: { name: 'TeamRecords', headers: [...], headerLabels: [...] },
  Simulations: { name: 'Simulations', headers: [...], headerLabels: [...] }
};
```

### 4.2 関数一覧

#### 4.2.1 セットアップ関数

| 関数名 | 説明 | 引数 | 戻り値 |
|--------|------|------|--------|
| `setupDatabase()` | 全シートの初期セットアップ | なし | 結果サマリー文字列 |
| `setupSheet(ss, definition)` | 個別シートのセットアップ | Spreadsheet, シート定義 | 結果オブジェクト |
| `setupSingleSheet(sheetKey)` | 単一シートのセットアップ | シートキー名 | 結果オブジェクト |
| `checkDatabaseStatus()` | DB状態確認 | なし | ステータス配列 |
| `clearAllData()` | 全データクリア（確認あり） | なし | なし |

#### 4.2.2 ユーティリティ関数

| 関数名 | 説明 | 引数 | 戻り値 |
|--------|------|------|--------|
| `generateUUID()` | UUID v4生成 | なし | UUID文字列 |
| `getCurrentDateTime()` | 現在日時取得 | なし | Date |
| `getSpreadsheet()` | スプレッドシート取得 | なし | Spreadsheet |
| `timeToSeconds(timeStr)` | 時間→秒変換 | "MM:SS" or "HH:MM:SS" | 秒数 or null |
| `secondsToTime(seconds)` | 秒→時間変換 | 秒数 | 時間文字列 |
| `formatDate(date)` | 日付フォーマット | Date or String | "YYYY/MM/DD" |

#### 4.2.3 データ取得API

| 関数名 | 説明 | 引数 | 戻り値 |
|--------|------|------|--------|
| `getPlayers(options)` | 選手一覧取得 | {sortBy, order} | {success, data: Player[]} |
| `getPlayerDetail(playerId)` | 選手詳細取得 | 選手ID | {success, data: Player} |
| `getPlayerRecords(playerId, options)` | 選手記録取得 | 選手ID, {sortBy, order} | {success, data: Record[]} |
| `getRecordHistory(playerId, section)` | グラフ用時系列データ | 選手ID, 種目 | {success, data: ChartData} |
| `getTeamRecords(options)` | チーム記録取得 | {sortBy, order} | {success, data: TeamRecord[]} |
| `loadSimulations()` | シミュレーション一覧 | なし | {success, data: Simulation[]} |

#### 4.2.4 ユーザーアクションAPI

| 関数名 | 説明 | 引数 | 戻り値 |
|--------|------|------|--------|
| `addPersonalRecord(data)` | 個人記録追加 | {player_id, race_name, date, section, time, memo} | {success, data: {record_id}} |
| `updateProfile(data)` | プロフィール更新 | {player_id, target_*, comment} | {success} |
| `calculateTargetDiff(bestTime, targetTime)` | 目標達成度計算 | ベスト, 目標 | {success, data: 差分情報} |

#### 4.2.5 管理者API

| 関数名 | 説明 | 引数 | 戻り値 |
|--------|------|------|--------|
| `addPlayer(data)` | 選手追加 | 選手データ | {success, data: {id}} |
| `updatePlayer(data)` | 選手更新 | 選手データ（id必須） | {success} |
| `deletePlayer(playerId)` | 選手論理削除 | 選手ID | {success} |
| `importPlayersFromCSV(csvContent)` | CSV一括登録 | CSV文字列 | {success, data: {imported, skipped, errors}} |
| `addTeamRecord(data)` | チーム記録追加 | チーム記録データ | {success, data: {team_record_id}} |
| `saveSimulation(data)` | シミュレーション保存 | {title, order_json} | {success, data: {sim_id}} |

#### 4.2.6 Webアプリエントリポイント

| 関数名 | 説明 | 引数 | 戻り値 |
|--------|------|------|--------|
| `doGet(e)` | GETリクエスト処理 | イベントオブジェクト | HtmlOutput |
| `include(filename)` | HTMLインクルード | ファイル名 | HTML文字列 |

### 4.3 API レスポンス形式

#### 成功時
```javascript
{
  success: true,
  data: { /* 結果データ */ }
}
```

#### 失敗時
```javascript
{
  success: false,
  error: "エラーメッセージ",
  data: null  // または []
}
```

### 4.4 バリデーションルール

| フィールド | ルール |
|-----------|--------|
| name | 必須、空文字不可 |
| registration_number | 必須、重複不可 |
| player_id | 必須、Playersに存在 |
| race_name | 必須（記録追加時） |
| section | 必須（記録追加時） |
| time | 必須（記録追加時）、"MM:SS" or "HH:MM:SS"形式 |

---

## 5. Webフロントエンド仕様

### 5.1 ページ構成

| ページ | ファイル | パラメータ | 説明 |
|--------|---------|-----------|------|
| メイン（選手一覧） | index.html | mode=user/admin | 選手一覧・選手詳細表示 |
| 選手詳細 | index.html | pid=選手ID, mode | 個人プロフィール・記録 |
| シミュレーション | simulation.html | mode=admin | 区間オーダー編成 |
| CSV登録 | csv.html | mode=admin | CSVインポート |

### 5.2 URLパラメータ

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| page | main/simulation/csv | 表示ページ指定 |
| mode | user/admin | ユーザーモード |
| pid | UUID | 選手ID（注: `id`はGAS予約語のため`pid`を使用） |

### 5.3 グローバル変数（JavaScript）

```javascript
const APP_MODE = 'user' | 'admin';  // モード
const INITIAL_PLAYER_ID = '';       // 初期表示選手ID
const BASE_URL = 'https://...';     // WebアプリベースURL
let currentPlayerId = null;         // 現在選択中の選手ID
let playersData = [];               // 選手データキャッシュ
let recordChart = null;             // Chart.jsインスタンス
```

### 5.4 UI コンポーネント

#### 5.4.1 選手カード
```html
<a class="player-card" href="?pid={id}&mode={mode}">
  <div class="player-card-number">{registration_number}</div>
  <div class="player-card-name">{name}</div>
  <div class="player-card-info">
    <span>{affiliation}</span>
    <span>{category}</span>
  </div>
</a>
```

#### 5.4.2 目標タイムカード
```html
<div class="target-card">
  <div class="target-card-label">{種目}</div>
  <div class="target-card-value">{目標タイム}</div>
  <div class="target-card-label">PB: {自己ベスト}</div>
  <div class="target-card-diff achieved|pending">{達成度}</div>
</div>
```

#### 5.4.3 記録アイテム
```html
<div class="record-item">
  <div class="record-item-header">
    <span class="record-item-date">{日付}</span>
    <span class="record-item-time">{タイム}</span>
  </div>
  <div class="record-item-race">{大会名}</div>
  <span class="record-item-section">{種目}</span>
</div>
```

### 5.5 モーダルダイアログ

| モーダルID | 用途 | トリガー |
|-----------|------|---------|
| playerModal | 選手追加/編集 | 「選手追加」ボタン / 「編集」ボタン |
| recordModal | 記録追加 | 「記録追加」ボタン |
| profileModal | プロフィール編集（ユーザー用） | 「目標編集」ボタン |
| saveModal | シミュレーション保存 | 「保存」ボタン |

### 5.6 CSS カスタムプロパティ

```css
:root {
  --primary-color: #4a86e8;
  --primary-dark: #3d71c7;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  --border-color: #dee2e6;
  --text-color: #333;
  --text-muted: #6c757d;
  --bg-color: #f5f7fa;
  --card-bg: #ffffff;
  --shadow: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.15);
  --radius: 8px;
  --radius-sm: 4px;
  --transition: all 0.2s ease;
}
```

### 5.7 レスポンシブブレークポイント

| ブレークポイント | 対象デバイス | レイアウト変更 |
|-----------------|-------------|---------------|
| 992px | タブレット | プロフィールページ1カラム化 |
| 768px | タブレット縦 | フォームグリッド1カラム化 |
| 480px | スマートフォン | カードグリッド1カラム化 |

---

## 6. Streamlitアプリケーション仕様

### 6.1 アプリ構成

| ファイル | 説明 |
|---------|------|
| app.py | メインページ（ダッシュボード） |
| pages/1_選手一覧.py | 選手一覧ページ |
| pages/2_選手詳細.py | 選手詳細ページ |
| pages/3_記録入力.py | 記録入力ページ |

### 6.2 共通設定

```python
st.set_page_config(
    page_title="駅伝チーム管理",
    page_icon="🏃",
    layout="wide",
    initial_sidebar_state="expanded",
)
```

### 6.3 認証設定

#### 環境変数優先（Hugging Face Spaces / Cloud Run）
```python
gcp_key = os.environ.get("GCP_KEY")
if gcp_key:
    credentials_info = json.loads(gcp_key)
```

#### Streamlit Secrets（Streamlit Cloud / ローカル）
```python
credentials_info = dict(st.secrets["gcp_service_account"])
```

### 6.4 キャッシュ設定

| デコレータ | TTL | 用途 |
|-----------|-----|------|
| `@st.cache_resource` | 永続 | gspreadクライアント、スプレッドシート |
| `@st.cache_data(ttl=60)` | 60秒 | 選手データ、記録データ |

### 6.5 utils/sheets.py 関数

| 関数名 | 説明 | 戻り値 |
|--------|------|--------|
| `get_credentials_info()` | 認証情報取得 | dict |
| `get_client()` | gspreadクライアント取得 | gspread.Client |
| `get_spreadsheet()` | スプレッドシート取得 | gspread.Spreadsheet |
| `get_players()` | 選手一覧取得 | pd.DataFrame |
| `get_player_by_id(player_id)` | 選手詳細取得 | dict or None |
| `get_records(player_id)` | 記録取得 | pd.DataFrame |
| `get_team_records()` | チーム記録取得 | pd.DataFrame |
| `add_record(...)` | 記録追加 | bool |
| `calculate_best_records(df)` | ベスト計算 | dict |
| `time_to_seconds(time_str)` | 時間→秒変換 | float or None |
| `seconds_to_time(seconds)` | 秒→時間変換 | str |

### 6.6 依存パッケージ

```
streamlit>=1.28.0
gspread>=5.12.0
google-auth>=2.23.0
pandas>=2.0.0
plotly>=5.18.0
```

---

## 7. API仕様

### 7.1 GAS Web App API

#### エンドポイント
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

#### パラメータ
| パラメータ | 値 | 説明 |
|-----------|-----|------|
| page | main/simulation/csv | ページ指定 |
| mode | user/admin | モード |
| pid | UUID | 選手ID |

### 7.2 クライアントサイドAPI呼び出し

```javascript
// 選手一覧取得
google.script.run
  .withSuccessHandler(function(result) {
    if (result.success) {
      console.log(result.data);
    }
  })
  .withFailureHandler(function(error) {
    console.error(error.message);
  })
  .getPlayers();
```

### 7.3 Google Sheets API スコープ

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

---

## 8. デプロイメント仕様（Google Cloud Run）

### 8.1 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐                      │
│  │   Cloud Run     │    │  Secret Manager │                      │
│  │   (Streamlit)   │◄───│  (GCP_KEY)      │                      │
│  └────────┬────────┘    └─────────────────┘                      │
│           │                                                       │
│           │ Google Sheets API                                     │
│           ▼                                                       │
│  ┌─────────────────┐                                             │
│  │ Google Sheets   │                                             │
│  │ (データベース)   │                                             │
│  └─────────────────┘                                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
           │
           │ HTTPS
           ▼
┌─────────────────┐
│   ユーザー       │
│   (ブラウザ)     │
└─────────────────┘
```

### 8.2 前提条件

| 項目 | 要件 |
|------|------|
| GCPプロジェクト | 有効なプロジェクトID |
| 課金 | Cloud Run、Sheets APIの課金有効化 |
| gcloud CLI | インストール済み、認証済み |
| Docker | ローカルビルド時に必要（オプション） |

### 8.3 サービスアカウント設定

#### 8.3.1 サービスアカウント作成

```bash
# プロジェクトIDを設定
export PROJECT_ID="your-project-id"

# サービスアカウント作成
gcloud iam service-accounts create ekiden-app \
  --display-name="Ekiden App Service Account" \
  --project=$PROJECT_ID

# サービスアカウントのメールアドレス
export SA_EMAIL="ekiden-app@${PROJECT_ID}.iam.gserviceaccount.com"
```

#### 8.3.2 必要な権限

| ロール | 用途 |
|--------|------|
| roles/run.invoker | Cloud Run呼び出し（公開時は不要） |

#### 8.3.3 サービスアカウントキー生成

```bash
# キーファイル生成
gcloud iam service-accounts keys create key.json \
  --iam-account=$SA_EMAIL \
  --project=$PROJECT_ID

# キーの内容を環境変数用に整形（改行を除去）
cat key.json | jq -c .
```

#### 8.3.4 Google Sheetsへの共有設定

1. 対象のスプレッドシートを開く
2. 「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（`ekiden-app@xxx.iam.gserviceaccount.com`）を追加
4. 権限を「編集者」に設定

### 8.4 Dockerfile

```dockerfile
# ベースイメージ
FROM python:3.11-slim

# 作業ディレクトリ
WORKDIR /app

# システム依存パッケージ（必要に応じて追加）
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python依存パッケージをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションをコピー
COPY . .

# Cloud Run用ポート設定
EXPOSE 8080

# Streamlit設定
ENV STREAMLIT_SERVER_ADDRESS=0.0.0.0
ENV STREAMLIT_SERVER_PORT=8080
ENV STREAMLIT_SERVER_HEADLESS=true
ENV STREAMLIT_BROWSER_GATHER_USAGE_STATS=false

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/_stcore/health || exit 1

# 起動コマンド
CMD ["streamlit", "run", "app.py", "--server.port=8080", "--server.address=0.0.0.0"]
```

### 8.5 requirements.txt

```
streamlit>=1.28.0
gspread>=5.12.0
google-auth>=2.23.0
pandas>=2.0.0
plotly>=5.18.0
```

### 8.6 環境変数

| 変数名 | 説明 | 必須 | 設定方法 |
|--------|------|------|---------|
| GCP_KEY | サービスアカウントJSON（1行形式） | ○ | Secret Manager推奨 |
| PORT | ポート番号 | - | Cloud Run自動設定（8080） |
| SPREADSHEET_ID | スプレッドシートID | ○ | 環境変数 or コード内定数 |

### 8.7 Cloud Runデプロイ手順

#### 8.7.1 Secret Managerでシークレット作成（推奨）

```bash
# シークレット作成
gcloud secrets create gcp-key \
  --replication-policy="automatic" \
  --project=$PROJECT_ID

# シークレットにキーを追加
gcloud secrets versions add gcp-key \
  --data-file=key.json \
  --project=$PROJECT_ID

# Cloud Runサービスアカウントにアクセス権付与
gcloud secrets add-iam-policy-binding gcp-key \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

#### 8.7.2 ソースからデプロイ（推奨）

```bash
# Cloud Runにデプロイ（ソースから自動ビルド）
gcloud run deploy ekiden-app \
  --source . \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GCP_KEY=gcp-key:latest" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --project=$PROJECT_ID
```

#### 8.7.3 Dockerイメージからデプロイ（代替）

```bash
# Artifact Registryにリポジトリ作成
gcloud artifacts repositories create ekiden-repo \
  --repository-format=docker \
  --location=asia-northeast1 \
  --project=$PROJECT_ID

# イメージをビルド・プッシュ
export IMAGE="asia-northeast1-docker.pkg.dev/${PROJECT_ID}/ekiden-repo/ekiden-app:latest"

gcloud builds submit --tag $IMAGE --project=$PROJECT_ID

# Cloud Runにデプロイ
gcloud run deploy ekiden-app \
  --image $IMAGE \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GCP_KEY=gcp-key:latest" \
  --memory 512Mi \
  --project=$PROJECT_ID
```

### 8.8 Cloud Run設定詳細

| 設定項目 | 推奨値 | 説明 |
|---------|--------|------|
| リージョン | asia-northeast1 | 東京リージョン |
| メモリ | 512Mi〜1Gi | Streamlitの負荷に応じて調整 |
| CPU | 1 | 通常用途では十分 |
| 最小インスタンス | 0 | コスト最適化（コールドスタートあり） |
| 最大インスタンス | 10 | 負荷に応じてスケール |
| タイムアウト | 300秒 | 長時間処理に対応 |
| 同時実行数 | 80 | デフォルト |

### 8.9 CI/CD設定（GitHub Actions）

#### .github/workflows/deploy.yml

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE_NAME: ekiden-app
  REGION: asia-northeast1

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --source . \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --set-secrets="GCP_KEY=gcp-key:latest"
```

### 8.10 モニタリング・ログ

#### Cloud Loggingでログ確認

```bash
# 最新のログを表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=ekiden-app" \
  --limit 50 \
  --project=$PROJECT_ID
```

#### Cloud Monitoringアラート設定（推奨）

| メトリクス | 閾値 | 説明 |
|-----------|------|------|
| request_latencies | > 5秒 | レスポンス遅延 |
| request_count（5xx） | > 10/分 | サーバーエラー急増 |
| instance_count | > 8 | スケールアウト警告 |

### 8.11 コスト見積もり

| 項目 | 無料枠 | 超過時の料金目安 |
|------|--------|-----------------|
| Cloud Run | 200万リクエスト/月 | $0.40/100万リクエスト |
| Cloud Run CPU | 180,000 vCPU秒/月 | $0.00002400/vCPU秒 |
| Cloud Run メモリ | 360,000 GiB秒/月 | $0.00000250/GiB秒 |
| Secret Manager | 6アクティブシークレット | $0.06/シークレット/月 |
| Sheets API | 500リクエスト/100秒 | 無料（クォータ制限のみ） |

※ 小規模チーム利用であれば無料枠内で収まる可能性が高い

### 8.12 トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 503 Service Unavailable | コンテナ起動失敗 | ログ確認、メモリ増量 |
| 認証エラー | GCP_KEY設定ミス | Secret Manager確認、JSON形式確認 |
| スプレッドシートアクセス拒否 | 共有設定漏れ | サービスアカウントに編集権限付与 |
| タイムアウト | 処理時間超過 | タイムアウト設定延長、処理最適化 |
| コールドスタート遅延 | min-instances=0 | min-instances=1に設定（コスト増） |

---

## 9. セキュリティ仕様

### 9.1 認証・認可

| レイヤー | 認証方式 | 説明 |
|---------|---------|------|
| Cloud Run | 公開（allow-unauthenticated） | URLを知っている人がアクセス可能 |
| Google Sheets API | サービスアカウント認証 | OAuth 2.0 サービスアカウントキー |
| アプリ内 | なし（将来拡張可能） | Streamlit Authenticator等で追加可能 |

### 9.2 シークレット管理

| 方式 | セキュリティ | 推奨度 |
|------|------------|--------|
| Secret Manager | 高（暗号化、アクセス制御、監査ログ） | ◎ 推奨 |
| 環境変数（直接設定） | 中（デプロイ時に表示される可能性） | △ 開発用 |
| コード内ハードコード | 低（GitHubに公開されるリスク） | × 禁止 |

### 9.3 ネットワークセキュリティ

| 項目 | 設定 |
|------|------|
| HTTPS | Cloud Runが自動でTLS終端 |
| カスタムドメイン | Cloud Run + Cloud Load Balancing |
| IP制限 | Cloud Armor（オプション） |

### 9.4 データ保護

| 項目 | 対策 |
|------|------|
| 論理削除 | 物理削除ではなくis_deletedフラグで管理 |
| 入力検証 | 必須項目チェック、重複チェック、形式検証 |
| XSS対策 | Streamlitの自動エスケープ |
| SQLインジェクション | 該当なし（スプレッドシート使用） |

### 9.5 Google Sheets API スコープ

最小限のスコープのみを使用:

```python
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",  # スプレッドシートの読み書き
]
```

### 9.6 アクセス制限オプション（将来拡張）

#### Streamlit Authenticatorによるログイン機能

```python
import streamlit_authenticator as stauth

# ユーザー認証設定
authenticator = stauth.Authenticate(
    credentials,
    "ekiden_app",
    "secret_key",
    cookie_expiry_days=30
)

name, authentication_status, username = authenticator.login()

if authentication_status:
    st.write(f"Welcome {name}")
elif authentication_status == False:
    st.error("ユーザー名/パスワードが正しくありません")
```

#### Cloud IAMによるアクセス制限

```bash
# 認証必須に変更
gcloud run services update ekiden-app \
  --no-allow-unauthenticated \
  --region asia-northeast1

# 特定ユーザーにアクセス権付与
gcloud run services add-iam-policy-binding ekiden-app \
  --member="user:user@example.com" \
  --role="roles/run.invoker" \
  --region asia-northeast1
```

---

## 付録

### A. タイムフォーマット仕様

| 形式 | 例 | 用途 |
|------|-----|------|
| MM:SS | 15:30 | 1500m, 3000m, 5000m |
| HH:MM:SS | 1:05:30 | 10000m, ハーフ, フル |
| 秒数 | 930 | 内部計算用 |

### B. 種目一覧

| 種目名 | 標準距離 |
|--------|---------|
| 1500m | 1.5km |
| 3000m | 3km |
| 5000m | 5km |
| 10000m | 10km |
| ハーフ（ハーフマラソン） | 21.0975km |
| フル（フルマラソン） | 42.195km |
| 1区〜10区 | 大会により異なる |

### C. エラーコード

| コード | 説明 |
|--------|------|
| SHEET_NOT_FOUND | 指定シートが存在しない |
| PLAYER_NOT_FOUND | 選手が見つからない |
| DUPLICATE_REGISTRATION | 登録番号が重複 |
| INVALID_TIME_FORMAT | タイム形式が不正 |
| REQUIRED_FIELD_MISSING | 必須項目が未入力 |

---

*ドキュメント作成日: 2024年*
*バージョン: 1.0*
