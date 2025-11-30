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

function myFunction() {

}
