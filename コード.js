/**
 * 縦断駅伝選手名簿 管理システム
 * Google Apps Script メインコード
 */

// ===========================================
// 定数定義
// ===========================================

/**
 * シート定義
 * 各シートの名前とヘッダー情報を定義
 */
const SHEET_DEFINITIONS = {
  Players: {
    name: 'Players',
    headers: [
      'id',                  // 選手ID (UUID)
      'registration_number', // 登録番号
      'name',                // 氏名
      'affiliation',         // 所属
      'category',            // 学年/カテゴリ
      'target_1500m',        // 1500m目標
      'target_3000m',        // 3000m目標
      'target_5000m',        // 5000m目標
      'target_10000m',       // 10000m目標
      'target_half',         // ハーフ目標
      'target_full',         // フル目標
      'comment',             // 一言/備考
      'is_deleted',          // 削除フラグ
      'created_at',          // 作成日時
      'updated_at'           // 更新日時
    ],
    headerLabels: [
      '選手ID',
      '登録番号',
      '氏名',
      '所属',
      '学年/カテゴリ',
      '1500m目標',
      '3000m目標',
      '5000m目標',
      '10000m目標',
      'ハーフ目標',
      'フル目標',
      '一言/備考',
      '削除フラグ',
      '作成日時',
      '更新日時'
    ]
  },
  Records: {
    name: 'Records',
    headers: [
      'record_id',   // 記録ID
      'player_id',   // 選手ID
      'race_name',   // 大会名
      'date',        // 開催日
      'section',     // 区間/種目
      'time',        // 記録
      'memo',        // 備考
      'created_at',  // 作成日時
      'updated_at'   // 更新日時
    ],
    headerLabels: [
      '記録ID',
      '選手ID',
      '大会名',
      '開催日',
      '区間/種目',
      '記録',
      '備考',
      '作成日時',
      '更新日時'
    ]
  },
  TeamRecords: {
    name: 'TeamRecords',
    headers: [
      'team_record_id', // ID
      'race_name',      // 大会名
      'date',           // 開催日
      'total_time',     // 総合記録
      'rank',           // 順位
      'memo',           // 備考
      'created_at',     // 作成日時
      'updated_at'      // 更新日時
    ],
    headerLabels: [
      'チーム記録ID',
      '大会名',
      '開催日',
      '総合記録',
      '順位',
      '備考',
      '作成日時',
      '更新日時'
    ]
  },
  Simulations: {
    name: 'Simulations',
    headers: [
      'sim_id',      // ID
      'title',       // 案の名称
      'created_at',  // 作成日
      'order_json',  // オーダーデータ (JSON)
      'updated_at'   // 更新日時
    ],
    headerLabels: [
      'シミュレーションID',
      '案の名称',
      '作成日時',
      'オーダーデータ',
      '更新日時'
    ]
  }
};

// ===========================================
// データベースセットアップ関数
// ===========================================

/**
 * データベース（スプレッドシート）の初期セットアップを実行
 * 全シートを作成し、ヘッダー行を設定する
 *
 * ※ GASエディタから手動で実行してください
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = [];

  Logger.log('=== データベースセットアップ開始 ===');

  for (const key in SHEET_DEFINITIONS) {
    const def = SHEET_DEFINITIONS[key];
    const result = setupSheet(ss, def);
    results.push(result);
    Logger.log(result.message);
  }

  // デフォルトの「シート1」があれば削除を提案
  const defaultSheet = ss.getSheetByName('シート1');
  if (defaultSheet) {
    Logger.log('注意: 「シート1」が残っています。不要であれば手動で削除してください。');
  }

  Logger.log('=== データベースセットアップ完了 ===');

  // 結果サマリーを返す
  return results.map(r => r.message).join('\n');
}

/**
 * 個別シートのセットアップ
 * @param {Spreadsheet} ss - スプレッドシートオブジェクト
 * @param {Object} definition - シート定義オブジェクト
 * @returns {Object} 結果オブジェクト
 */
function setupSheet(ss, definition) {
  const { name, headers, headerLabels } = definition;

  // シートの存在確認
  let sheet = ss.getSheetByName(name);
  let isNew = false;

  if (sheet) {
    // 既存シートがある場合はヘッダーのみ更新
    Logger.log(`シート「${name}」は既に存在します。ヘッダーを確認します。`);
  } else {
    // 新規シート作成
    sheet = ss.insertSheet(name);
    isNew = true;
    Logger.log(`シート「${name}」を新規作成しました。`);
  }

  // ヘッダー行を設定（1行目: カラム名、2行目: 日本語ラベル）
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const labelRange = sheet.getRange(2, 1, 1, headerLabels.length);

  headerRange.setValues([headers]);
  labelRange.setValues([headerLabels]);

  // ヘッダー行のスタイル設定
  headerRange
    .setBackground('#4a86e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  labelRange
    .setBackground('#c9daf8')
    .setFontWeight('bold');

  // 行を固定（ヘッダー2行を固定表示）
  sheet.setFrozenRows(2);

  // 列幅を自動調整
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  return {
    sheetName: name,
    isNew: isNew,
    columnCount: headers.length,
    message: `✓ ${name}: ${isNew ? '新規作成' : '更新'} (${headers.length}列)`
  };
}

/**
 * 特定のシートのみをセットアップ
 * @param {string} sheetKey - SHEET_DEFINITIONS のキー名
 */
function setupSingleSheet(sheetKey) {
  if (!SHEET_DEFINITIONS[sheetKey]) {
    throw new Error(`シート定義「${sheetKey}」が見つかりません。`);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = setupSheet(ss, SHEET_DEFINITIONS[sheetKey]);
  Logger.log(result.message);
  return result;
}

/**
 * データベースの状態を確認
 * 各シートの存在とデータ行数を表示
 */
function checkDatabaseStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const status = [];

  Logger.log('=== データベース状態確認 ===');

  for (const key in SHEET_DEFINITIONS) {
    const def = SHEET_DEFINITIONS[key];
    const sheet = ss.getSheetByName(def.name);

    if (sheet) {
      const lastRow = sheet.getLastRow();
      const dataRows = Math.max(0, lastRow - 2); // ヘッダー2行を除く
      const info = `✓ ${def.name}: 存在 (データ ${dataRows} 行)`;
      status.push({ name: def.name, exists: true, dataRows: dataRows });
      Logger.log(info);
    } else {
      const info = `✗ ${def.name}: 未作成`;
      status.push({ name: def.name, exists: false, dataRows: 0 });
      Logger.log(info);
    }
  }

  Logger.log('=== 確認完了 ===');
  return status;
}

/**
 * 全シートのデータをクリア（ヘッダーは残す）
 * ※ 注意: データが全て削除されます
 */
function clearAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '警告',
    '全てのデータを削除しますか？\nこの操作は取り消せません。',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('操作がキャンセルされました。');
    return;
  }

  for (const key in SHEET_DEFINITIONS) {
    const sheet = ss.getSheetByName(SHEET_DEFINITIONS[key].name);
    if (sheet && sheet.getLastRow() > 2) {
      sheet.deleteRows(3, sheet.getLastRow() - 2);
      Logger.log(`${SHEET_DEFINITIONS[key].name}: データをクリアしました。`);
    }
  }

  Logger.log('全シートのデータをクリアしました。');
}

// ===========================================
// ユーティリティ関数
// ===========================================

/**
 * UUID v4 を生成
 * @returns {string} UUID文字列
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 現在の日時を取得
 * @returns {Date} 現在日時
 */
function getCurrentDateTime() {
  return new Date();
}

// ===========================================
// テスト用関数
// ===========================================

/**
 * GAS連携テスト用の関数
 * スプレッドシートにメッセージを書き込む
 */
function testConnection() {
  const message = "GitHub → GAS 連携テスト成功！";
  Logger.log(message);

  // アクティブなスプレッドシートのA1セルにメッセージを書き込む
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange("A1").setValue(message);
  sheet.getRange("A2").setValue(new Date());

  return message;
}
