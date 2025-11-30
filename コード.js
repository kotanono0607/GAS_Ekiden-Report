/**
 * 縦断駅伝選手名簿 管理システム
 * Google Apps Script メインコード
 */

// ===========================================
// 定数定義
// ===========================================

/**
 * スプレッドシートID
 * Webアプリとしてデプロイする際に必要
 */
const SPREADSHEET_ID = '1Obbd41yFX_KPmag4foqtijxRpUgTZCzBq0vpqff-f3k';

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

/**
 * スプレッドシートを取得
 * Webアプリからの呼び出しとエディタからの呼び出し両方に対応
 * @returns {Spreadsheet} スプレッドシートオブジェクト
 */
function getSpreadsheet() {
  console.log('[getSpreadsheet] 開始');

  // Webアプリの場合はgetActiveSpreadsheetがnullを返すため、IDで開く
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      console.log('[getSpreadsheet] getActiveSpreadsheet成功');
      return ss;
    }
    console.log('[getSpreadsheet] getActiveSpreadsheetはnull');
  } catch (e) {
    console.log('[getSpreadsheet] getActiveSpreadsheet失敗: ' + e.message);
  }

  // IDで開く
  try {
    console.log('[getSpreadsheet] openByIdを試行: ' + SPREADSHEET_ID);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('[getSpreadsheet] openById成功');
    return ss;
  } catch (e) {
    console.error('[getSpreadsheet] openById失敗: ' + e.message);
    throw new Error('スプレッドシートを開けません: ' + e.message);
  }
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

/**
 * Webアプリからの接続テスト用関数
 * ブラウザのコンソールから google.script.run.testWebConnection() で呼び出し可能
 */
function testWebConnection() {
  console.log('[testWebConnection] 開始');

  try {
    // スプレッドシート取得テスト
    const ss = getSpreadsheet();
    console.log('[testWebConnection] スプレッドシート名: ' + ss.getName());

    // Playersシート取得テスト
    const sheet = ss.getSheetByName('Players');
    if (sheet) {
      const lastRow = sheet.getLastRow();
      console.log('[testWebConnection] Playersシート lastRow: ' + lastRow);
    } else {
      console.log('[testWebConnection] Playersシートが見つかりません');
    }

    return {
      success: true,
      message: 'テスト成功',
      spreadsheetName: ss.getName(),
      playersSheetExists: !!sheet
    };
  } catch (e) {
    console.error('[testWebConnection] エラー: ' + e.message);
    return {
      success: false,
      error: e.message,
      stack: e.stack
    };
  }
}

/**
 * 最もシンプルなテスト - 固定値を返す
 */
function simpleTest() {
  return { success: true, message: "サーバー接続OK", timestamp: new Date().toString() };
}

/**
 * 段階的テスト - 問題の切り分け用
 */
function debugTest1() {
  // 文字列のみ
  return "hello";
}

function debugTest2() {
  // シンプルなオブジェクト
  return { a: 1, b: "test" };
}

function debugTest3() {
  // スプレッドシートにアクセスせずにgetPlayersと同じ構造を返す
  return {
    success: true,
    data: [
      { id: "1", name: "テスト太郎", registration_number: "001" },
      { id: "2", name: "テスト花子", registration_number: "002" }
    ]
  };
}

function debugTest4() {
  // スプレッドシートアクセスのみテスト
  try {
    const ss = getSpreadsheet();
    return { success: true, spreadsheetName: ss.getName() };
  } catch (e) {
    return { success: false, error: e.message, stack: e.stack };
  }
}

function debugTest5() {
  // スプレッドシートからデータ取得（Date変換あり）
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Players');
    if (!sheet) {
      return { success: false, error: 'シートなし' };
    }
    const lastRow = sheet.getLastRow();
    if (lastRow <= 2) {
      return { success: true, data: [], message: 'データなし' };
    }
    // 最初の1行だけ取得
    const row = sheet.getRange(3, 1, 1, 15).getValues()[0];
    // Date型を文字列に変換
    const safeRow = row.map(cell => {
      if (cell instanceof Date) {
        return cell.toISOString();
      }
      return cell;
    });
    return { success: true, firstRow: safeRow };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===========================================
// データ取得API（共通）
// ===========================================

/**
 * 全選手を取得（削除フラグがfalseのもの）
 * @param {Object} options - オプション {sortBy: 'registration_number'|'name', order: 'asc'|'desc'}
 * @returns {Array} 選手オブジェクトの配列
 */
function getPlayers(options = {}) {
  console.log('[getPlayers] 開始');

  try {
    const ss = getSpreadsheet();
    console.log('[getPlayers] スプレッドシート取得成功');

    const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Players.name);
    console.log('[getPlayers] Playersシート: ' + (sheet ? '取得成功' : 'null'));

    if (!sheet) {
      return { success: false, error: 'Playersシートが見つかりません', data: [] };
    }

    const lastRow = sheet.getLastRow();
    console.log('[getPlayers] lastRow: ' + lastRow);

    if (lastRow <= 2) {
      console.log('[getPlayers] データなし');
      return { success: true, data: [] };
    }

    const headers = SHEET_DEFINITIONS.Players.headers;
    const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
    const data = dataRange.getValues();
    console.log('[getPlayers] データ取得: ' + data.length + '行');

    // オブジェクト配列に変換（Date型は文字列に変換）
    let players = data.map(row => {
      const player = {};
      headers.forEach((header, index) => {
        let value = row[index];
        // Date型を文字列に変換（google.script.runでシリアライズ可能にする）
        if (value instanceof Date) {
          value = value.toISOString();
        }
        player[header] = value;
      });
      return player;
    });

    // 削除フラグがfalseのもののみフィルタ
    players = players.filter(p => !p.is_deleted);
    console.log('[getPlayers] フィルタ後: ' + players.length + '件');

    // ソート
    const sortBy = options.sortBy || 'registration_number';
    const order = options.order || 'asc';

    players.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    console.log('[getPlayers] 完了');
    return { success: true, data: players };

  } catch (e) {
    console.error('[getPlayers] エラー: ' + e.message);
    console.error('[getPlayers] スタック: ' + e.stack);
    return { success: false, error: 'データ取得エラー: ' + e.message, data: [] };
  }
}

/**
 * 特定選手の詳細情報を取得
 * @param {string} playerId - 選手ID
 * @returns {Object} 選手詳細オブジェクト
 */
function getPlayerDetail(playerId) {
  if (!playerId) {
    return { success: false, error: '選手IDが指定されていません', data: null };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Players.name);

  if (!sheet) {
    return { success: false, error: 'Playersシートが見つかりません', data: null };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) {
    return { success: false, error: '選手が見つかりません', data: null };
  }

  const headers = SHEET_DEFINITIONS.Players.headers;
  const idColIndex = headers.indexOf('id') + 1;
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const data = dataRange.getValues();

  // IDで検索
  const rowIndex = data.findIndex(row => row[idColIndex - 1] === playerId);

  if (rowIndex === -1) {
    return { success: false, error: '選手が見つかりません', data: null };
  }

  const row = data[rowIndex];
  const player = {};
  headers.forEach((header, index) => {
    let value = row[index];
    if (value instanceof Date) {
      value = value.toISOString();
    }
    player[header] = value;
  });

  // 削除済みチェック
  if (player.is_deleted) {
    return { success: false, error: '選手は削除されています', data: null };
  }

  // 自己ベストを取得
  const recordsResult = getPlayerRecords(playerId);
  if (recordsResult.success && recordsResult.data.length > 0) {
    player.bestRecords = calculateBestRecords(recordsResult.data);
  } else {
    player.bestRecords = {};
  }

  return { success: true, data: player };
}

/**
 * 選手の自己ベストを計算
 * @param {Array} records - 記録配列
 * @returns {Object} 種目ごとの自己ベスト
 */
function calculateBestRecords(records) {
  const bests = {};

  records.forEach(record => {
    const section = record.section;
    const time = record.time;

    if (!time) return;

    const seconds = timeToSeconds(time);
    if (seconds === null) return;

    if (!bests[section] || seconds < bests[section].seconds) {
      bests[section] = {
        time: time,
        seconds: seconds,
        date: record.date,
        race_name: record.race_name
      };
    }
  });

  return bests;
}

/**
 * 特定選手の記録一覧を取得
 * @param {string} playerId - 選手ID
 * @param {Object} options - オプション {sortBy: 'date', order: 'desc'}
 * @returns {Object} 記録オブジェクトの配列
 */
function getPlayerRecords(playerId, options = {}) {
  if (!playerId) {
    return { success: false, error: '選手IDが指定されていません', data: [] };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Records.name);

  if (!sheet) {
    return { success: false, error: 'Recordsシートが見つかりません', data: [] };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) {
    return { success: true, data: [] };
  }

  const headers = SHEET_DEFINITIONS.Records.headers;
  const playerIdColIndex = headers.indexOf('player_id');
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const data = dataRange.getValues();

  // 選手IDでフィルタ
  let records = data
    .filter(row => row[playerIdColIndex] === playerId)
    .map(row => {
      const record = {};
      headers.forEach((header, index) => {
        let value = row[index];
        if (value instanceof Date) {
          value = value.toISOString();
        }
        record[header] = value;
      });
      return record;
    });

  // ソート（デフォルト: 日付降順）
  const sortBy = options.sortBy || 'date';
  const order = options.order || 'desc';

  records.sort((a, b) => {
    let valA = a[sortBy] || '';
    let valB = b[sortBy] || '';

    // ISO文字列の日付は文字列比較でも正しくソートされる
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return { success: true, data: records };
}

/**
 * グラフ描画用の時系列データを取得
 * @param {string} playerId - 選手ID
 * @param {string} section - 種目（例: "5000m"）
 * @returns {Object} 時系列データ {labels: [], data: []}
 */
function getRecordHistory(playerId, section) {
  if (!playerId) {
    return { success: false, error: '選手IDが指定されていません', data: null };
  }

  const recordsResult = getPlayerRecords(playerId, { sortBy: 'date', order: 'asc' });

  if (!recordsResult.success) {
    return recordsResult;
  }

  let records = recordsResult.data;

  // 種目でフィルタ（指定がある場合）
  if (section) {
    records = records.filter(r => r.section === section);
  }

  // グラフ用データに変換
  const chartData = {
    labels: [],  // 日付ラベル
    datasets: {} // 種目ごとのデータセット
  };

  records.forEach(record => {
    const dateLabel = formatDate(record.date);
    const seconds = timeToSeconds(record.time);

    if (seconds === null) return;

    if (!chartData.datasets[record.section]) {
      chartData.datasets[record.section] = [];
    }

    chartData.datasets[record.section].push({
      x: dateLabel,
      y: seconds,
      time: record.time,
      race_name: record.race_name
    });
  });

  return { success: true, data: chartData };
}

/**
 * チーム記録一覧を取得
 * @param {Object} options - オプション
 * @returns {Object} チーム記録の配列
 */
function getTeamRecords(options = {}) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.TeamRecords.name);

  if (!sheet) {
    return { success: false, error: 'TeamRecordsシートが見つかりません', data: [] };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) {
    return { success: true, data: [] };
  }

  const headers = SHEET_DEFINITIONS.TeamRecords.headers;
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const data = dataRange.getValues();

  let records = data.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      let value = row[index];
      if (value instanceof Date) {
        value = value.toISOString();
      }
      record[header] = value;
    });
    return record;
  });

  // ソート（デフォルト: 日付降順）
  const sortBy = options.sortBy || 'date';
  const order = options.order || 'desc';

  records.sort((a, b) => {
    let valA = a[sortBy] || '';
    let valB = b[sortBy] || '';

    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return { success: true, data: records };
}

// ===========================================
// ユーザーアクションAPI
// ===========================================

/**
 * 個人記録を追加
 * @param {Object} data - 記録データ {player_id, race_name, date, section, time, memo}
 * @returns {Object} 結果
 */
function addPersonalRecord(data) {
  if (!data.player_id) {
    return { success: false, error: '選手IDが指定されていません' };
  }
  if (!data.race_name) {
    return { success: false, error: '大会名が指定されていません' };
  }
  if (!data.section) {
    return { success: false, error: '種目が指定されていません' };
  }
  if (!data.time) {
    return { success: false, error: '記録が指定されていません' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Records.name);

  if (!sheet) {
    return { success: false, error: 'Recordsシートが見つかりません' };
  }

  const now = getCurrentDateTime();
  const recordId = generateUUID();

  const headers = SHEET_DEFINITIONS.Records.headers;
  const newRow = headers.map(header => {
    switch (header) {
      case 'record_id': return recordId;
      case 'player_id': return data.player_id;
      case 'race_name': return data.race_name;
      case 'date': return data.date ? new Date(data.date) : now;
      case 'section': return data.section;
      case 'time': return data.time;
      case 'memo': return data.memo || '';
      case 'created_at': return now;
      case 'updated_at': return now;
      default: return '';
    }
  });

  sheet.appendRow(newRow);

  return { success: true, data: { record_id: recordId } };
}

/**
 * プロフィール（目標タイム・コメント）を更新
 * @param {Object} data - 更新データ {player_id, target_*, comment}
 * @returns {Object} 結果
 */
function updateProfile(data) {
  if (!data.player_id) {
    return { success: false, error: '選手IDが指定されていません' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Players.name);

  if (!sheet) {
    return { success: false, error: 'Playersシートが見つかりません' };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) {
    return { success: false, error: '選手が見つかりません' };
  }

  const headers = SHEET_DEFINITIONS.Players.headers;
  const idColIndex = headers.indexOf('id') + 1;
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const sheetData = dataRange.getValues();

  // IDで検索
  const rowIndex = sheetData.findIndex(row => row[idColIndex - 1] === data.player_id);

  if (rowIndex === -1) {
    return { success: false, error: '選手が見つかりません' };
  }

  const actualRowNumber = rowIndex + 3; // ヘッダー2行分を加算

  // 更新可能なフィールド
  const updatableFields = [
    'target_1500m', 'target_3000m', 'target_5000m',
    'target_10000m', 'target_half', 'target_full', 'comment'
  ];

  updatableFields.forEach(field => {
    if (data[field] !== undefined) {
      const colIndex = headers.indexOf(field) + 1;
      if (colIndex > 0) {
        sheet.getRange(actualRowNumber, colIndex).setValue(data[field]);
      }
    }
  });

  // updated_at を更新
  const updatedAtColIndex = headers.indexOf('updated_at') + 1;
  sheet.getRange(actualRowNumber, updatedAtColIndex).setValue(getCurrentDateTime());

  return { success: true };
}

/**
 * 目標達成度（差分）を計算
 * @param {string} bestTime - 自己ベスト（例: "15:30"）
 * @param {string} targetTime - 目標タイム（例: "15:00"）
 * @returns {Object} 差分情報
 */
function calculateTargetDiff(bestTime, targetTime) {
  const bestSeconds = timeToSeconds(bestTime);
  const targetSeconds = timeToSeconds(targetTime);

  if (bestSeconds === null || targetSeconds === null) {
    return { success: false, error: '時間の形式が不正です' };
  }

  const diffSeconds = bestSeconds - targetSeconds;
  const diffFormatted = secondsToTime(Math.abs(diffSeconds));

  return {
    success: true,
    data: {
      diff_seconds: diffSeconds,
      diff_formatted: (diffSeconds > 0 ? '-' : '+') + diffFormatted,
      achieved: diffSeconds <= 0,
      message: diffSeconds <= 0
        ? '目標達成！'
        : `あと ${diffFormatted} で目標達成`
    }
  };
}

// ===========================================
// 管理者アクションAPI
// ===========================================

/**
 * 新規選手を追加
 * @param {Object} data - 選手データ
 * @returns {Object} 結果
 */
function addPlayer(data) {
  if (!data.name) {
    return { success: false, error: '氏名が指定されていません' };
  }
  if (!data.registration_number) {
    return { success: false, error: '登録番号が指定されていません' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Players.name);

  if (!sheet) {
    return { success: false, error: 'Playersシートが見つかりません' };
  }

  // 登録番号の重複チェック
  const existingPlayers = getPlayers();
  if (existingPlayers.success) {
    const duplicate = existingPlayers.data.find(
      p => p.registration_number === data.registration_number
    );
    if (duplicate) {
      return { success: false, error: `登録番号「${data.registration_number}」は既に使用されています` };
    }
  }

  const now = getCurrentDateTime();
  const playerId = generateUUID();

  const headers = SHEET_DEFINITIONS.Players.headers;
  const newRow = headers.map(header => {
    switch (header) {
      case 'id': return playerId;
      case 'registration_number': return data.registration_number;
      case 'name': return data.name;
      case 'affiliation': return data.affiliation || '';
      case 'category': return data.category || '';
      case 'target_1500m': return data.target_1500m || '';
      case 'target_3000m': return data.target_3000m || '';
      case 'target_5000m': return data.target_5000m || '';
      case 'target_10000m': return data.target_10000m || '';
      case 'target_half': return data.target_half || '';
      case 'target_full': return data.target_full || '';
      case 'comment': return data.comment || '';
      case 'is_deleted': return false;
      case 'created_at': return now;
      case 'updated_at': return now;
      default: return '';
    }
  });

  sheet.appendRow(newRow);

  return { success: true, data: { id: playerId } };
}

/**
 * 選手情報を更新
 * @param {Object} data - 更新データ（idは必須）
 * @returns {Object} 結果
 */
function updatePlayer(data) {
  if (!data.id) {
    return { success: false, error: '選手IDが指定されていません' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Players.name);

  if (!sheet) {
    return { success: false, error: 'Playersシートが見つかりません' };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) {
    return { success: false, error: '選手が見つかりません' };
  }

  const headers = SHEET_DEFINITIONS.Players.headers;
  const idColIndex = headers.indexOf('id') + 1;
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const sheetData = dataRange.getValues();

  const rowIndex = sheetData.findIndex(row => row[idColIndex - 1] === data.id);

  if (rowIndex === -1) {
    return { success: false, error: '選手が見つかりません' };
  }

  // 登録番号の重複チェック（自分以外）
  if (data.registration_number) {
    const existingPlayers = getPlayers();
    if (existingPlayers.success) {
      const duplicate = existingPlayers.data.find(
        p => p.registration_number === data.registration_number && p.id !== data.id
      );
      if (duplicate) {
        return { success: false, error: `登録番号「${data.registration_number}」は既に使用されています` };
      }
    }
  }

  const actualRowNumber = rowIndex + 3;

  // 更新可能なフィールド（id, created_at, is_deleted以外）
  const updatableFields = [
    'registration_number', 'name', 'affiliation', 'category',
    'target_1500m', 'target_3000m', 'target_5000m',
    'target_10000m', 'target_half', 'target_full', 'comment'
  ];

  updatableFields.forEach(field => {
    if (data[field] !== undefined) {
      const colIndex = headers.indexOf(field) + 1;
      if (colIndex > 0) {
        sheet.getRange(actualRowNumber, colIndex).setValue(data[field]);
      }
    }
  });

  // updated_at を更新
  const updatedAtColIndex = headers.indexOf('updated_at') + 1;
  sheet.getRange(actualRowNumber, updatedAtColIndex).setValue(getCurrentDateTime());

  return { success: true };
}

/**
 * 選手を論理削除
 * @param {string} playerId - 選手ID
 * @returns {Object} 結果
 */
function deletePlayer(playerId) {
  if (!playerId) {
    return { success: false, error: '選手IDが指定されていません' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Players.name);

  if (!sheet) {
    return { success: false, error: 'Playersシートが見つかりません' };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) {
    return { success: false, error: '選手が見つかりません' };
  }

  const headers = SHEET_DEFINITIONS.Players.headers;
  const idColIndex = headers.indexOf('id') + 1;
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const sheetData = dataRange.getValues();

  const rowIndex = sheetData.findIndex(row => row[idColIndex - 1] === playerId);

  if (rowIndex === -1) {
    return { success: false, error: '選手が見つかりません' };
  }

  const actualRowNumber = rowIndex + 3;

  // is_deleted を true に設定
  const isDeletedColIndex = headers.indexOf('is_deleted') + 1;
  sheet.getRange(actualRowNumber, isDeletedColIndex).setValue(true);

  // updated_at を更新
  const updatedAtColIndex = headers.indexOf('updated_at') + 1;
  sheet.getRange(actualRowNumber, updatedAtColIndex).setValue(getCurrentDateTime());

  return { success: true };
}

/**
 * CSVから選手を一括登録
 * @param {string} csvContent - CSV文字列
 * @returns {Object} 結果 {success, imported, skipped, errors}
 */
function importPlayersFromCSV(csvContent) {
  if (!csvContent) {
    return { success: false, error: 'CSVデータが空です' };
  }

  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    return { success: false, error: 'CSVにデータがありません' };
  }

  // ヘッダー行を解析
  const csvHeaders = lines[0].split(',').map(h => h.trim().toLowerCase());

  // 必須フィールドのチェック
  const requiredFields = ['name', 'registration_number'];
  const missingFields = requiredFields.filter(f => !csvHeaders.includes(f));
  if (missingFields.length > 0) {
    return { success: false, error: `必須フィールドがありません: ${missingFields.join(', ')}` };
  }

  const results = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  // データ行を処理
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const data = {};

    csvHeaders.forEach((header, index) => {
      if (values[index] !== undefined) {
        data[header] = values[index].trim();
      }
    });

    // 追加を試行
    const result = addPlayer(data);
    if (result.success) {
      results.imported++;
    } else {
      results.skipped++;
      results.errors.push(`行 ${i + 1}: ${result.error}`);
    }
  }

  return {
    success: true,
    data: results
  };
}

/**
 * CSV行をパース（カンマ区切り、ダブルクォート対応）
 * @param {string} line - CSV行
 * @returns {Array} 値の配列
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * チーム記録を追加
 * @param {Object} data - チーム記録データ
 * @returns {Object} 結果
 */
function addTeamRecord(data) {
  if (!data.race_name) {
    return { success: false, error: '大会名が指定されていません' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.TeamRecords.name);

  if (!sheet) {
    return { success: false, error: 'TeamRecordsシートが見つかりません' };
  }

  const now = getCurrentDateTime();
  const recordId = generateUUID();

  const headers = SHEET_DEFINITIONS.TeamRecords.headers;
  const newRow = headers.map(header => {
    switch (header) {
      case 'team_record_id': return recordId;
      case 'race_name': return data.race_name;
      case 'date': return data.date ? new Date(data.date) : now;
      case 'total_time': return data.total_time || '';
      case 'rank': return data.rank || '';
      case 'memo': return data.memo || '';
      case 'created_at': return now;
      case 'updated_at': return now;
      default: return '';
    }
  });

  sheet.appendRow(newRow);

  return { success: true, data: { team_record_id: recordId } };
}

/**
 * シミュレーションを保存
 * @param {Object} data - シミュレーションデータ {title, order_json}
 * @returns {Object} 結果
 */
function saveSimulation(data) {
  if (!data.title) {
    return { success: false, error: 'シミュレーション名が指定されていません' };
  }
  if (!data.order_json) {
    return { success: false, error: 'オーダーデータが指定されていません' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Simulations.name);

  if (!sheet) {
    return { success: false, error: 'Simulationsシートが見つかりません' };
  }

  const now = getCurrentDateTime();
  const simId = generateUUID();

  // order_jsonがオブジェクトの場合はJSON文字列に変換
  const orderJsonStr = typeof data.order_json === 'object'
    ? JSON.stringify(data.order_json)
    : data.order_json;

  const headers = SHEET_DEFINITIONS.Simulations.headers;
  const newRow = headers.map(header => {
    switch (header) {
      case 'sim_id': return simId;
      case 'title': return data.title;
      case 'created_at': return now;
      case 'order_json': return orderJsonStr;
      case 'updated_at': return now;
      default: return '';
    }
  });

  sheet.appendRow(newRow);

  return { success: true, data: { sim_id: simId } };
}

/**
 * 保存済みシミュレーション一覧を取得
 * @returns {Object} シミュレーション配列
 */
function loadSimulations() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Simulations.name);

  if (!sheet) {
    return { success: false, error: 'Simulationsシートが見つかりません', data: [] };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) {
    return { success: true, data: [] };
  }

  const headers = SHEET_DEFINITIONS.Simulations.headers;
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const data = dataRange.getValues();

  const simulations = data.map(row => {
    const sim = {};
    headers.forEach((header, index) => {
      if (header === 'order_json') {
        // JSONをパース
        try {
          sim[header] = JSON.parse(row[index]);
        } catch (e) {
          sim[header] = row[index];
        }
      } else {
        sim[header] = row[index];
      }
    });
    return sim;
  });

  // 作成日時降順でソート
  simulations.sort((a, b) => {
    const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
    const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
    return dateB - dateA;
  });

  return { success: true, data: simulations };
}

// ===========================================
// 時間変換ユーティリティ
// ===========================================

/**
 * 時間文字列を秒数に変換
 * @param {string} timeStr - 時間文字列（例: "1:23:45", "15:30", "4:10"）
 * @returns {number|null} 秒数
 */
function timeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const parts = timeStr.split(':').map(Number);

  if (parts.some(isNaN)) return null;

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return null;
}

/**
 * 秒数を時間文字列に変換
 * @param {number} seconds - 秒数
 * @returns {string} 時間文字列
 */
function secondsToTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
}

/**
 * 日付をフォーマット
 * @param {Date|string} date - 日付
 * @returns {string} フォーマットされた日付文字列
 */
function formatDate(date) {
  if (!date) return '';

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

// ===========================================
// Webアプリ エントリポイント
// ===========================================

/**
 * Webアプリのエントリポイント
 * GETリクエストを処理してHTMLを返す
 * @param {Object} e - イベントオブジェクト
 * @returns {HtmlOutput} HTMLページ
 */
function doGet(e) {
  const params = e ? e.parameter : {};
  const page = params.page || 'main';
  const mode = params.mode || 'user'; // 'user' or 'admin'

  let template;

  switch (page) {
    case 'simulation':
      template = HtmlService.createTemplateFromFile('simulation');
      break;
    case 'csv':
      template = HtmlService.createTemplateFromFile('csv');
      break;
    default:
      template = HtmlService.createTemplateFromFile('index');
  }

  // テンプレートにパラメータを渡す
  template.mode = mode;
  // 注意: 'id'パラメータはGASが内部で使用するため、'pid'を使用
  template.playerId = params.pid || '';

  return template.evaluate()
    .setTitle('縦断駅伝選手名簿管理システム')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * HTMLファイルをインクルード
 * @param {string} filename - ファイル名
 * @returns {string} HTML文字列
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ===========================================
// テスト用ダミーデータ作成関数
// ===========================================

/**
 * ダミーデータを一括作成
 * 選手10名、各選手に記録5件、チーム記録3件を作成
 *
 * ※ GASエディタから手動で実行してください
 */
function createDummyData() {
  Logger.log('=== ダミーデータ作成開始 ===');

  // 選手データを作成
  const playerIds = createDummyPlayers();
  Logger.log(`選手 ${playerIds.length} 名を作成しました`);

  // 各選手に記録を作成
  let totalRecords = 0;
  playerIds.forEach(playerId => {
    const count = createDummyRecordsForPlayer(playerId);
    totalRecords += count;
  });
  Logger.log(`記録 ${totalRecords} 件を作成しました`);

  // チーム記録を作成
  const teamRecordCount = createDummyTeamRecords();
  Logger.log(`チーム記録 ${teamRecordCount} 件を作成しました`);

  Logger.log('=== ダミーデータ作成完了 ===');

  return {
    players: playerIds.length,
    records: totalRecords,
    teamRecords: teamRecordCount
  };
}

/**
 * ダミー選手データを作成
 * @returns {Array} 作成した選手IDの配列
 */
function createDummyPlayers() {
  const dummyPlayers = [
    {
      registration_number: '001',
      name: '山田 太郎',
      affiliation: '東京高校',
      category: '高校生',
      target_1500m: '4:10',
      target_3000m: '9:00',
      target_5000m: '15:30',
      target_10000m: '32:00',
      target_half: '',
      target_full: '',
      comment: '今シーズンは5000mで自己ベスト更新を目指す'
    },
    {
      registration_number: '002',
      name: '佐藤 花子',
      affiliation: '東京高校',
      category: '高校生',
      target_1500m: '4:40',
      target_3000m: '9:50',
      target_5000m: '17:00',
      target_10000m: '35:00',
      target_half: '',
      target_full: '',
      comment: '駅伝のエースを目指して練習中'
    },
    {
      registration_number: '003',
      name: '鈴木 一郎',
      affiliation: '大阪大学',
      category: '大学生',
      target_1500m: '3:55',
      target_3000m: '8:30',
      target_5000m: '14:30',
      target_10000m: '30:00',
      target_half: '1:06:00',
      target_full: '',
      comment: '箱根駅伝出場を目標に'
    },
    {
      registration_number: '004',
      name: '田中 美咲',
      affiliation: '大阪大学',
      category: '大学生',
      target_1500m: '4:25',
      target_3000m: '9:20',
      target_5000m: '16:00',
      target_10000m: '33:30',
      target_half: '1:15:00',
      target_full: '',
      comment: '全日本大学女子駅伝を目指す'
    },
    {
      registration_number: '005',
      name: '高橋 健太',
      affiliation: '市民ランナーズ',
      category: '一般',
      target_1500m: '4:30',
      target_3000m: '9:40',
      target_5000m: '16:30',
      target_10000m: '34:00',
      target_half: '1:18:00',
      target_full: '2:50:00',
      comment: 'サブスリー達成が目標'
    },
    {
      registration_number: '006',
      name: '伊藤 さくら',
      affiliation: '市民ランナーズ',
      category: '一般',
      target_1500m: '5:00',
      target_3000m: '10:30',
      target_5000m: '18:00',
      target_10000m: '37:00',
      target_half: '1:25:00',
      target_full: '3:10:00',
      comment: '楽しく走ることが一番！'
    },
    {
      registration_number: '007',
      name: '渡辺 隼人',
      affiliation: '福岡高校',
      category: '高校生',
      target_1500m: '4:05',
      target_3000m: '8:45',
      target_5000m: '15:00',
      target_10000m: '31:00',
      target_half: '',
      target_full: '',
      comment: 'インターハイ入賞を目指す'
    },
    {
      registration_number: '008',
      name: '中村 愛',
      affiliation: '福岡高校',
      category: '高校生',
      target_1500m: '4:35',
      target_3000m: '9:40',
      target_5000m: '16:45',
      target_10000m: '34:30',
      target_half: '',
      target_full: '',
      comment: '3000mで県記録を狙う'
    },
    {
      registration_number: '009',
      name: '小林 大輔',
      affiliation: 'マスターズクラブ',
      category: '40代',
      target_1500m: '4:50',
      target_3000m: '10:20',
      target_5000m: '17:30',
      target_10000m: '36:00',
      target_half: '1:22:00',
      target_full: '3:00:00',
      comment: '年齢に負けず記録更新中'
    },
    {
      registration_number: '010',
      name: '加藤 恵',
      affiliation: 'マスターズクラブ',
      category: '30代',
      target_1500m: '5:10',
      target_3000m: '10:50',
      target_5000m: '18:30',
      target_10000m: '38:00',
      target_half: '1:28:00',
      target_full: '3:15:00',
      comment: '子育てしながらマラソン挑戦'
    }
  ];

  const playerIds = [];

  dummyPlayers.forEach(playerData => {
    const result = addPlayer(playerData);
    if (result.success) {
      playerIds.push(result.data.id);
    } else {
      Logger.log(`選手追加エラー: ${playerData.name} - ${result.error}`);
    }
  });

  return playerIds;
}

/**
 * 特定選手のダミー記録を作成
 * @param {string} playerId - 選手ID
 * @returns {number} 作成した記録数
 */
function createDummyRecordsForPlayer(playerId) {
  const sections = ['1500m', '3000m', '5000m', '10000m'];
  const races = [
    '春季記録会',
    '県選手権',
    '地区予選',
    '秋季記録会',
    '冬季ロードレース'
  ];

  let count = 0;
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 6); // 6ヶ月前から

  // 各種目で1-2件の記録を作成
  sections.forEach((section, sectionIndex) => {
    const numRecords = Math.floor(Math.random() * 2) + 1; // 1-2件

    for (let i = 0; i < numRecords; i++) {
      const recordDate = new Date(baseDate);
      recordDate.setDate(recordDate.getDate() + (sectionIndex * 30) + (i * 45)); // 日付をずらす

      // タイムを生成（種目に応じて）
      const time = generateRandomTime(section);

      const result = addPersonalRecord({
        player_id: playerId,
        race_name: races[Math.floor(Math.random() * races.length)],
        date: recordDate.toISOString().split('T')[0],
        section: section,
        time: time,
        memo: i === 0 ? '自己ベスト更新！' : ''
      });

      if (result.success) {
        count++;
      }
    }
  });

  return count;
}

/**
 * 種目に応じたランダムタイムを生成
 * @param {string} section - 種目
 * @returns {string} タイム文字列
 */
function generateRandomTime(section) {
  let baseSec, variance;

  switch (section) {
    case '1500m':
      baseSec = 270; // 4:30
      variance = 40;
      break;
    case '3000m':
      baseSec = 570; // 9:30
      variance = 60;
      break;
    case '5000m':
      baseSec = 990; // 16:30
      variance = 120;
      break;
    case '10000m':
      baseSec = 2040; // 34:00
      variance = 180;
      break;
    case 'ハーフ':
      baseSec = 4800; // 1:20:00
      variance = 600;
      break;
    case 'フル':
      baseSec = 10800; // 3:00:00
      variance = 1200;
      break;
    default:
      baseSec = 600;
      variance = 60;
  }

  const randomSec = baseSec + Math.floor(Math.random() * variance * 2) - variance;
  return secondsToTime(randomSec);
}

/**
 * ダミーチーム記録を作成
 * @returns {number} 作成した記録数
 */
function createDummyTeamRecords() {
  const dummyTeamRecords = [
    {
      race_name: '第50回 県縦断駅伝',
      date: '2024-11-15',
      total_time: '5:23:45',
      rank: 3,
      memo: '前年より5分短縮！'
    },
    {
      race_name: '第25回 市民駅伝大会',
      date: '2024-02-11',
      total_time: '2:45:30',
      rank: 1,
      memo: '優勝！全員が自己ベスト'
    },
    {
      race_name: '第49回 県縦断駅伝',
      date: '2023-11-16',
      total_time: '5:28:50',
      rank: 5,
      memo: '来年こそトップ3へ'
    }
  ];

  let count = 0;

  dummyTeamRecords.forEach(recordData => {
    const result = addTeamRecord(recordData);
    if (result.success) {
      count++;
    }
  });

  return count;
}

/**
 * 全ダミーデータを削除
 * ※ 注意: 全データが削除されます
 */
function clearDummyData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '警告',
    '全てのデータを削除しますか？\nこの操作は取り消せません。',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('操作がキャンセルされました');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 各シートのデータを削除（ヘッダーは残す）
  ['Players', 'Records', 'TeamRecords', 'Simulations'].forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 2) {
      sheet.deleteRows(3, sheet.getLastRow() - 2);
      Logger.log(`${sheetName}: データをクリアしました`);
    }
  });

  Logger.log('全データを削除しました');
}
