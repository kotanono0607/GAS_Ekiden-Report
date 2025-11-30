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

// ===========================================
// データ取得API（共通）
// ===========================================

/**
 * 全選手を取得（削除フラグがfalseのもの）
 * @param {Object} options - オプション {sortBy: 'registration_number'|'name', order: 'asc'|'desc'}
 * @returns {Array} 選手オブジェクトの配列
 */
function getPlayers(options = {}) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DEFINITIONS.Players.name);

  if (!sheet) {
    return { success: false, error: 'Playersシートが見つかりません', data: [] };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) {
    return { success: true, data: [] };
  }

  const headers = SHEET_DEFINITIONS.Players.headers;
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const data = dataRange.getValues();

  // オブジェクト配列に変換
  let players = data.map(row => {
    const player = {};
    headers.forEach((header, index) => {
      player[header] = row[index];
    });
    return player;
  });

  // 削除フラグがfalseのもののみフィルタ
  players = players.filter(p => !p.is_deleted);

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

  return { success: true, data: players };
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
    player[header] = row[index];
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
        record[header] = row[index];
      });
      return record;
    });

  // ソート（デフォルト: 日付降順）
  const sortBy = options.sortBy || 'date';
  const order = options.order || 'desc';

  records.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    // 日付の場合
    if (valA instanceof Date && valB instanceof Date) {
      return order === 'desc' ? valB - valA : valA - valB;
    }

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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
      record[header] = row[index];
    });
    return record;
  });

  // ソート（デフォルト: 日付降順）
  const sortBy = options.sortBy || 'date';
  const order = options.order || 'desc';

  records.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (valA instanceof Date && valB instanceof Date) {
      return order === 'desc' ? valB - valA : valA - valB;
    }

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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
  template.playerId = params.id || '';

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
