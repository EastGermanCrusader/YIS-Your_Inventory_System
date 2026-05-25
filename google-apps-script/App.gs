/**
 * YIS (Your Inventory System) – Google Apps Script Backend
 * Neu bereitstellen nach jeder Änderung (Web-App, Zugriff: „Jeder“)
 */
/** Gleicher Wert wie in token.txt (Root) – vor Bereitstellung anpassen */
var MEIN_GEHEIMER_TOKEN = 'DEIN_GEHEIMES_TOKEN_HIER';

var HEADERS = [
  'Seriennummer',
  'Bezeichnung',
  'Beschreibung',
  'Kategorie',
  'Standort',
  'Status',
  'ErstelltAm',
  'GeaendertAm',
  'ErfasstVon'
];

var ANLAGEN_HEADERS = [
  'DateiId',
  'Seriennummer',
  'Dateiname',
  'MimeType',
  'Groesse',
  'Teil',
  'TeileGesamt',
  'Daten',
  'HochgeladenAm',
  'Status'
];

var CHUNK_CHARS = 40000;
var MAX_UPLOAD_BYTES = 1572864;

function doGet(e) {
  e = e || { parameter: {} };
  var action = e.parameter.action || 'list';
  var sheet = getDataSheet();

  try {
    if (needsToken(action, e) && !checkToken(e)) {
      return jsonOut({ ok: false, error: 'Zugriff verweigert: Falscher Token' }, e);
    }

    if (action === 'list') {
      return jsonOut({ ok: true, items: getAllItems(sheet) }, e);
    }
    if (action === 'get') {
      var sn = e.parameter.sn || '';
      var item = getItemBySerial(sheet, sn);
      if (!item) return jsonOut({ ok: false, error: 'Akte nicht gefunden' }, e);
      item.dateien = listFilesForSerial(sn);
      return jsonOut({ ok: true, item: item }, e);
    }
    if (action === 'listFiles') {
      var snList = e.parameter.seriennummer || e.parameter.sn || '';
      return jsonOut({ ok: true, dateien: listFilesForSerial(snList) }, e);
    }
    if (action === 'getFileContent') {
      var fileContent = getFileContentById(
        e.parameter.dateiId || '',
        e.parameter.sn || ''
      );
      return jsonOut({ ok: true, datei: fileContent }, e);
    }
    if (action === 'ping') {
      return jsonOut({ ok: true, message: 'YIS API aktiv' }, e);
    }
    if (action === 'nextSerial') {
      return jsonOut({ ok: true, seriennummer: generateSerialNumber(sheet) }, e);
    }
    if (action === 'create') {
      var createPayload = parseDataParam(e.parameter.data);
      var created = createItem(sheet, createPayload);
      return jsonOut({ ok: true, item: created }, e);
    }
    if (action === 'update') {
      var updatePayload = parseDataParam(e.parameter.data);
      var updated = updateItem(sheet, updatePayload);
      return jsonOut({ ok: true, item: updated }, e);
    }
    if (action === 'delete') {
      var removed = softDeleteItem(sheet, e.parameter.seriennummer || '');
      return jsonOut({ ok: true, item: removed }, e);
    }
    if (action === 'uploadFile') {
      var uploadPayload = parseDataParam(e.parameter.data);
      return jsonOut({ ok: true, datei: uploadFileForSerial(uploadPayload) }, e);
    }
    if (action === 'deleteFile') {
      return jsonOut({ ok: true, datei: deleteFileById(e.parameter.dateiId || '') }, e);
    }

    return jsonOut({ ok: false, error: 'Unbekannte Aktion: ' + action }, e);
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) }, e);
  }
}

function doPost(e) {
  e = e || { parameter: {} };
  if (!checkToken(e)) {
    return jsonOut({ ok: false, error: 'Zugriff verweigert: Falscher Token' }, e);
  }

  var sheet = getDataSheet();
  var body = {};

  try {
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (parseErr) {
    return jsonOut({ ok: false, error: 'Ungültige JSON-Daten' }, e);
  }

  var action = body.action || (e.parameter && e.parameter.action) || '';

  try {
    if (action === 'create') {
      return jsonOut({ ok: true, item: createItem(sheet, body.item || {}) }, e);
    }
    if (action === 'update') {
      return jsonOut({ ok: true, item: updateItem(sheet, body.item || {}) }, e);
    }
    if (action === 'delete') {
      return jsonOut({ ok: true, item: softDeleteItem(sheet, body.seriennummer || '') }, e);
    }
    if (action === 'nextSerial') {
      return jsonOut({ ok: true, seriennummer: generateSerialNumber(sheet) }, e);
    }
    if (action === 'uploadFile') {
      return jsonOut({ ok: true, datei: uploadFileForSerial(body) }, e);
    }
    if (action === 'deleteFile') {
      return jsonOut({ ok: true, datei: deleteFileById(body.dateiId || '') }, e);
    }
    if (action === 'listFiles') {
      return jsonOut({ ok: true, dateien: listFilesForSerial(body.seriennummer || body.sn || '') }, e);
    }
    return jsonOut({ ok: false, error: 'Unbekannte Aktion: ' + action }, e);
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) }, e);
  }
}

/**
 * Token-Pflicht:
 * - list / get (ohne sn): nur mit Passwort
 * - get + sn: öffentlich (QR-Code / Direktlink)
 * - ping: öffentlich
 */
function needsToken(action, e) {
  e = e || { parameter: {} };
  if (action === 'ping') return false;
  if (action === 'get' && e.parameter.sn) return false;
  if (action === 'getFileContent' && e.parameter.sn) return false;
  if (action === 'list' || action === 'get') return true;
  if (action === 'getFileContent') return true;
  var tokenActions = ['create', 'update', 'delete', 'nextSerial', 'listFiles', 'uploadFile', 'deleteFile'];
  return tokenActions.indexOf(action) >= 0;
}

function checkToken(e) {
  var token = (e && e.parameter && e.parameter.token) ? e.parameter.token : '';
  return token === MEIN_GEHEIMER_TOKEN;
}

function parseDataParam(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Ungültige Daten (data)');
  }
}

function getDataSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Inventar') || ss.getActiveSheet();
  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var needsHeader = !firstRow[0] || String(firstRow[0]).indexOf('Seriennummer') === -1;
  if (needsHeader && sheet.getLastRow() === 1 && !firstRow[0]) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else if (needsHeader) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function getAllItems(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var items = [];
  for (var i = 1; i < data.length; i++) {
    var item = rowToItem(data[i]);
    if (item && item.seriennummer && item.status !== 'Entfernt') {
      items.push(item);
    }
  }
  return items;
}

function getItemBySerial(sheet, serial) {
  if (!serial) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var item = rowToItem(data[i]);
    if (item && item.seriennummer === serial) return item;
  }
  return null;
}

function createItem(sheet, payload) {
  var serial = payload.seriennummer || generateSerialNumber(sheet);
  if (getItemBySerial(sheet, serial)) {
    throw new Error('Seriennummer existiert bereits: ' + serial);
  }

  var now = new Date().toISOString();
  var row = [
    serial,
    payload.bezeichnung || '',
    payload.beschreibung || '',
    payload.kategorie || 'Allgemein',
    payload.standort || '',
    payload.status || 'Aktiv',
    now,
    now,
    payload.erfasstVon || 'System'
  ];

  sheet.appendRow(row);
  return getItemBySerial(sheet, serial);
}

function updateItem(sheet, payload) {
  var serial = payload.seriennummer;
  if (!serial) throw new Error('Seriennummer fehlt');

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === serial) {
      var rowIndex = i + 1;
      sheet.getRange(rowIndex, 2).setValue(payload.bezeichnung !== undefined ? payload.bezeichnung : data[i][1]);
      sheet.getRange(rowIndex, 3).setValue(payload.beschreibung !== undefined ? payload.beschreibung : data[i][2]);
      sheet.getRange(rowIndex, 4).setValue(payload.kategorie !== undefined ? payload.kategorie : data[i][3]);
      sheet.getRange(rowIndex, 5).setValue(payload.standort !== undefined ? payload.standort : data[i][4]);
      sheet.getRange(rowIndex, 6).setValue(payload.status !== undefined ? payload.status : data[i][5]);
      sheet.getRange(rowIndex, 8).setValue(new Date().toISOString());
      return getItemBySerial(sheet, serial);
    }
  }
  throw new Error('Akte nicht gefunden: ' + serial);
}

function softDeleteItem(sheet, serial) {
  return updateItem(sheet, { seriennummer: serial, status: 'Entfernt' });
}

function generateSerialNumber(sheet) {
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Berlin', 'yyyyMMdd');
  var prefix = 'YIS-' + date + '-';
  var data = sheet.getDataRange().getValues();
  var max = 0;

  for (var i = 1; i < data.length; i++) {
    var sn = String(data[i][0] || '');
    if (sn.indexOf(prefix) === 0) {
      var part = sn.substring(prefix.length);
      var num = parseInt(part, 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }

  var next = max + 1;
  var padded = ('0000' + next).slice(-4);
  return prefix + padded;
}

function rowToItem(row) {
  if (!row || !row[0]) return null;
  return {
    seriennummer: String(row[0]),
    bezeichnung: String(row[1] || ''),
    beschreibung: String(row[2] || ''),
    kategorie: String(row[3] || ''),
    standort: String(row[4] || ''),
    status: String(row[5] || 'Aktiv'),
    erstelltAm: String(row[6] || ''),
    geaendertAm: String(row[7] || ''),
    erfasstVon: String(row[8] || '')
  };
}

function getAttachmentsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Anlagen');
  if (!sheet) {
    sheet = ss.insertSheet('Anlagen');
    sheet.appendRow(ANLAGEN_HEADERS);
  } else {
    ensureAnlagenHeaders(sheet);
  }
  return sheet;
}

function ensureAnlagenHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ANLAGEN_HEADERS);
    return;
  }
  var first = sheet.getRange(1, 1, 1, ANLAGEN_HEADERS.length).getValues()[0];
  var isOldFormat = String(first[5]) === 'DriveFileId';
  if (String(first[0]) !== 'DateiId' || isOldFormat) {
    sheet.getRange(1, 1, 1, ANLAGEN_HEADERS.length).setValues([ANLAGEN_HEADERS]);
  }
}

function listFilesForSerial(serial) {
  if (!serial) return [];
  var grouped = loadFileGroupsForSerial(serial);
  var list = [];
  for (var id in grouped) {
    if (grouped.hasOwnProperty(id)) list.push(grouped[id].meta);
  }
  return list;
}

function loadFileGroupsForSerial(serial) {
  var sheet = getAttachmentsSheet();
  var data = sheet.getDataRange().getValues();
  var groups = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[1]) !== serial) continue;
    if (String(row[9]) === 'Entfernt') continue;
    var id = String(row[0]);
    if (!groups[id]) {
      groups[id] = {
        meta: {
          dateiId: id,
          seriennummer: String(row[1]),
          dateiname: String(row[2]),
          mimeType: String(row[3]),
          groesse: Number(row[4]) || 0,
          hochgeladenAm: String(row[8] || ''),
          teileGesamt: Number(row[6]) || 1
        },
        parts: {}
      };
    }
    groups[id].parts[Number(row[5]) || 1] = String(row[7] || '');
  }
  return groups;
}

function mergeChunks(parts, total) {
  var merged = '';
  for (var p = 1; p <= total; p++) {
    if (!parts[p]) throw new Error('Unvollständige Datei (Teil ' + p + ' fehlt)');
    merged += parts[p];
  }
  return merged;
}

function getFileContentById(dateiId, serialOptional) {
  if (!dateiId) throw new Error('DateiId fehlt');
  var sheet = getAttachmentsSheet();
  var data = sheet.getDataRange().getValues();
  var meta = null;
  var parts = {};
  var total = 1;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[0]) !== dateiId) continue;
    if (String(row[9]) === 'Entfernt') continue;
    meta = {
      dateiId: dateiId,
      seriennummer: String(row[1]),
      dateiname: String(row[2]),
      mimeType: String(row[3]),
      groesse: Number(row[4]) || 0,
      hochgeladenAm: String(row[8] || '')
    };
    total = Number(row[6]) || 1;
    parts[Number(row[5]) || 1] = String(row[7] || '');
  }

  if (!meta) throw new Error('Datei nicht gefunden');
  if (serialOptional && meta.seriennummer !== serialOptional) {
    throw new Error('Datei gehört nicht zu dieser Akte');
  }

  var contentBase64 = mergeChunks(parts, total);
  meta.contentBase64 = contentBase64;
  meta.dataUrl = 'data:' + meta.mimeType + ';base64,' + contentBase64;
  return meta;
}

function uploadFileForSerial(payload) {
  var teil = Number(payload.teil) || 0;
  var total = Number(payload.teileGesamt) || 0;

  if (teil > 0 && total > 0) {
    return uploadFileChunkPart(payload);
  }

  var serial = payload.seriennummer;
  if (!serial) throw new Error('Seriennummer fehlt');
  if (!getItemBySerial(getDataSheet(), serial)) {
    throw new Error('Akte nicht gefunden: ' + serial);
  }

  var filename = payload.dateiname || 'datei';
  var mimeType = payload.mimeType || 'application/octet-stream';
  var content = String(payload.contentBase64 || '').replace(/\s/g, '');
  if (!content) throw new Error('Dateiinhalt fehlt');

  var bytes = Utilities.base64Decode(content);
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error('Datei zu groß (max. 1,5 MB – Speicher in Tabelle)');
  }

  var fileId = 'F-' + Utilities.getUuid().substring(0, 8);
  var now = new Date().toISOString();
  var chunks = [];
  for (var i = 0; i < content.length; i += CHUNK_CHARS) {
    chunks.push(content.substring(i, i + CHUNK_CHARS));
  }
  if (!chunks.length) chunks.push('');

  var sheet = getAttachmentsSheet();
  for (var c = 0; c < chunks.length; c++) {
    sheet.appendRow([
      fileId,
      serial,
      filename,
      mimeType,
      bytes.length,
      c + 1,
      chunks.length,
      chunks[c],
      c === 0 ? now : '',
      'Aktiv'
    ]);
  }

  return {
    dateiId: fileId,
    seriennummer: serial,
    dateiname: filename,
    mimeType: mimeType,
    groesse: bytes.length,
    hochgeladenAm: now,
    teileGesamt: chunks.length
  };
}

/** Einzelnes Chunk-Upload (JSONP / GET) */
function uploadFileChunkPart(payload) {
  var serial = payload.seriennummer;
  if (!serial) throw new Error('Seriennummer fehlt');

  var teil = Number(payload.teil);
  var total = Number(payload.teileGesamt);
  if (!teil || !total || teil > total) {
    throw new Error('Ungültige Chunk-Angaben');
  }

  if (teil === 1 && !getItemBySerial(getDataSheet(), serial)) {
    throw new Error('Akte nicht gefunden: ' + serial);
  }

  var groesse = Number(payload.groesse) || 0;
  if (groesse > MAX_UPLOAD_BYTES) {
    throw new Error('Datei zu groß (max. 1,5 MB – Speicher in Tabelle)');
  }

  var dateiId = payload.dateiId || ('F-' + Utilities.getUuid().substring(0, 8));
  var filename = payload.dateiname || 'datei';
  var mimeType = payload.mimeType || 'application/octet-stream';
  var chunk = String(payload.chunkBase64 || '').replace(/\s/g, '');
  var now = new Date().toISOString();
  var sheet = getAttachmentsSheet();

  sheet.appendRow([
    dateiId,
    serial,
    filename,
    mimeType,
    groesse,
    teil,
    total,
    chunk,
    teil === 1 ? now : '',
    'Aktiv'
  ]);

  if (teil < total) {
    return {
      dateiId: dateiId,
      seriennummer: serial,
      dateiname: filename,
      mimeType: mimeType,
      groesse: groesse,
      pending: true,
      teil: teil,
      teileGesamt: total
    };
  }

  var groups = loadFileGroupsForSerial(serial);
  if (!groups[dateiId]) {
    throw new Error('Upload unvollständig');
  }
  mergeChunks(groups[dateiId].parts, total);
  return groups[dateiId].meta;
}

function deleteFileById(dateiId) {
  if (!dateiId) throw new Error('DateiId fehlt');
  var sheet = getAttachmentsSheet();
  var data = sheet.getDataRange().getValues();
  var found = false;
  var meta = null;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== dateiId) continue;
    sheet.getRange(i + 1, 10).setValue('Entfernt');
    found = true;
    if (!meta) {
      meta = {
        dateiId: dateiId,
        seriennummer: String(data[i][1]),
        dateiname: String(data[i][2]),
        mimeType: String(data[i][3]),
        groesse: Number(data[i][4]) || 0,
        hochgeladenAm: String(data[i][8] || '')
      };
    }
  }

  if (!found) throw new Error('Datei nicht gefunden');
  return meta;
}

/** JSONP-fähige Ausgabe (callback=…) für Browser ohne CORS */
function jsonOut(obj, e) {
  var text = JSON.stringify(obj);
  var cb = (e && e.parameter && e.parameter.callback) ? String(e.parameter.callback) : '';
  if (cb && /^[a-zA-Z0-9_]+$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + text + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}
