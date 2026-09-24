/**
 * PRAJNA CO-HAB — free data capture backend (Google Sheets + Apps Script)
 * SETUP (10 min, zero cost):
 * 1. Create a new Google Sheet named "Prajna Data" (sheets.new)
 * 2. Extensions → Apps Script → delete everything → paste this file
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the /exec URL → paste it into assets/site.js → PRAJNA.endpoint
 * Tabs (Inquiries, Feedback, Board) are created automatically.
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.type === 'board') { return boardFeed(); }
  return json({ ok: true });
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActive();
    if (d.type === 'board') {
      appendRow(ss, 'Board', ['Time','Name','Topic','Message','Approved'],
        [new Date(), String(d.name || '').slice(0,60), String(d.topic || 'General').slice(0,30), String(d.message || '').slice(0,500), false]);
    } else if (d.type === 'feedback') {
      appendRow(ss, 'Feedback', ['Time','Name','Role','Rating','Message'],
        [new Date(), String(d.name || 'Anonymous').slice(0,60), String(d.role || '').slice(0,20), String(d.rating || ''), String(d.message || '').slice(0,600)]);
    } else {
      appendRow(ss, 'Inquiries', ['Time','Name','Phone','Interest','Move-in','Message'],
        [new Date(), String(d.name || '').slice(0,60), String(d.phone || '').slice(0,20), String(d.interest || '').slice(0,30), String(d.movein || '').slice(0,30), String(d.message || '').slice(0,400)]);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function boardFeed() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Board');
  var out = [];
  if (sh) {
    var data = sh.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1 && out.length < 50; i--) {
      if (data[i][4] === true) {
        out.push({ name: String(data[i][1]), topic: String(data[i][2]), message: String(data[i][3]) });
      }
    }
  }
  return json(out);
}

function appendRow(ss, name, headers, row) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  sh.appendRow(row);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
