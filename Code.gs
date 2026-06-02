// ============================================================
// PUNTO M — Dashboard Backend (Google Apps Script)
// Pegar en el editor de Apps Script del sheet y desplegar
// como Web App con acceso "Anyone"
// ============================================================

var SHEET_ID = "1hxGWW9krB3JnUlUkC6nn5FrQIz-Md_N0hKXUZB4UqUk";

var TABS = [
  "01_ESTRATEGIA_MENSUAL",
  "02_PRODUCTOS",
  "03_REELS",
  "04_WHATSAPP",
  "05_STORIES",
  "06_EMAILS",
  "07_CALENDARIO_COMERCIAL",
  "08_CARRUSELES",
  "09_WEB"
];

// ---- GET: leer datos ----------------------------------------
function doGet(e) {
  var output;
  try {
    var tab = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : "all";
    var ss  = SpreadsheetApp.openById(SHEET_ID);
    var result = {};

    if (tab === "all") {
      TABS.forEach(function(name) { result[name] = readTab(ss, name); });
    } else {
      result[tab] = readTab(ss, tab);
    }

    output = JSON.stringify({ success: true, data: result });
  } catch (err) {
    output = JSON.stringify({ success: false, error: err.toString() });
  }

  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- POST: guardar performance ------------------------------
function doPost(e) {
  var output;
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss      = SpreadsheetApp.openById(SHEET_ID);
    var sheet   = ss.getSheetByName(payload.tab);

    if (!sheet) throw new Error("Tab no encontrada: " + payload.tab);

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var colIdx  = headers.indexOf(payload.column);
    if (colIdx === -1) throw new Error("Columna no encontrada: " + payload.column);

    sheet.getRange(payload.row, colIdx + 1).setValue(payload.value);
    output = JSON.stringify({ success: true });
  } catch (err) {
    output = JSON.stringify({ success: false, error: err.toString() });
  }

  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Leer una tab ------------------------------------------
function readTab(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var tz      = ss.getSpreadsheetTimeZone();
  var headers = values[0].map(function(h) { return h.toString().trim(); });
  var rows    = [];

  for (var i = 1; i < values.length; i++) {
    var row     = values[i];
    var isEmpty = row.every(function(c) { return c === "" || c === null || c === undefined; });
    if (isEmpty) continue;

    var obj = { _rowIndex: i + 1 };
    headers.forEach(function(header, j) {
      if (!header) return;
      var val = row[j];
      if (val instanceof Date) {
        obj[header] = Utilities.formatDate(val, tz, "dd/MM/yyyy");
      } else {
        obj[header] = (val !== null && val !== undefined) ? val.toString() : "";
      }
    });
    rows.push(obj);
  }

  return rows;
}
