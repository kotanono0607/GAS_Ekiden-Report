# Claude Code 引き継ぎ書 Ver.1
# GAS_Ekiden-Report プロジェクト

## プロジェクト概要

駅伝名簿管理システムのGoogle Apps Script (GAS) プロジェクト。
GitHubとGASを連携し、コード管理を行う。

---

## 環境情報

| 項目 | 値 |
|------|-----|
| ローカルフォルダ | `C:\Users\hello\GAS_ekidenmeibo` |
| GitHubリポジトリ | https://github.com/kotanono0607/GAS_Ekiden-Report |
| GASプロジェクトID | `1O3xBrVmL6FEBnIlvBXLKMTMc1ZcWH43BebeN080vVdPYgyTxT3ZDH-hI` |
| スプレッドシート | https://docs.google.com/spreadsheets/d/1Obbd41yFX_KPmag4foqtijxRpUgTZCzBq0vpqff-f3k/ |

---

## ファイル構成

```
C:\Users\hello\GAS_ekidenmeibo\
├── .clasp.json      # clasp設定（GASプロジェクトID）
├── appsscript.json  # GASマニフェスト
└── コード.js         # メインスクリプト
```

---

## 必要なツール

- **clasp**: GASとローカルの同期ツール（インストール済み）
- **Git**: バージョン管理（インストール済み）

---

## 作業フロー

### GitHubの変更をGASに反映する手順

```powershell
# 1. 作業フォルダに移動
cd "C:\Users\hello\GAS_ekidenmeibo"

# 2. GitHubから最新を取得
git pull origin main

# 3. GASに反映
clasp push
```

### GASの変更をGitHubに反映する手順

```powershell
# 1. 作業フォルダに移動
cd "C:\Users\hello\GAS_ekidenmeibo"

# 2. GASから最新を取得
clasp pull

# 3. Gitにコミット＆プッシュ
git add .
git commit -m "GASからの変更を反映"
git push origin main
```

---

## コマンド早見表

| 操作 | コマンド |
|------|---------|
| GASから取得 | `clasp pull` |
| GASへ反映 | `clasp push` |
| GitHubから取得 | `git pull origin main` |
| GitHubへ反映 | `git add .` → `git commit -m "メッセージ"` → `git push` |
| GASをブラウザで開く | `clasp open` |
| 変更状態確認 | `git status` |
| 差分確認 | `git diff` |

---

## 注意事項

1. **作業前に必ず `git pull` と `clasp pull` で最新化すること**
2. **コード.js はファイル名が日本語なので注意**
3. **clasp push 前にGASエディタを閉じておくこと（競合防止）**

---

## GASプロジェクトへのアクセス

- GASエディタ: https://script.google.com/u/0/home/projects/1O3xBrVmL6FEBnIlvBXLKMTMc1ZcWH43BebeN080vVdPYgyTxT3ZDH-hI/edit

---

## トラブルシューティング

### clasp push/pull でエラーが出る場合

```powershell
# 再ログイン
clasp login --creds
```

### EMFILE エラー（too many open files）

PowerShellを再起動してから再実行。

### git push でエラーが出る場合

```powershell
# リモートの変更を先に取り込む
git pull origin main --rebase
git push origin main
```
