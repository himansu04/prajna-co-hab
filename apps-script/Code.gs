/**
 * PRAJNA CO-HAB — data capture backend (Google Sheets + Apps Script)
 *
 * SETUP (10 min, zero cost)
 * 1. sheets.new → name it "Prajna Data"
 * 2. Extensions → Apps Script → paste this file over the sample code
 * 3. Run setup() once (authorise when asked)
 * 4. Deploy → New deployment → Web app
 *      Execute as: Me        Who has access: Anyone
 * 5. Copy the /exec URL → paste into config.js as endpoint (and assets/site.js PRAJNA.endpoint)
 *
 * Tabs created by setup(): Inquiries · Feedback · Board · Digest · Errors
 * Every row is timestamped in IST. Board posts stay hidden until Approved = TRUE.
 * A daily digest email lands at DIGEST_TO so nothing depends on opening the sheet.
 */

var TZ = 'Asia/Kolkata';
var DIGEST_TO = '';          // e.g. 'owner@example.com' — blank = digest off
var MAX_ROWS = 200000;       // safety valve so the sheet never becomes unreadable

/* ---------------------------------------------------------------- setup */
function setup() {
  var ss = SpreadsheetApp.getActive();
  var spec = {
    Inquiries: ['Time', 'Name', 'Phone', 'Interest', 'Move-in', 'Message', 'Source', 'Status', 'Notes'],
    Feedback:  ['Time', 'Name', 'Role', 'Rating', 'Message', 'Published'],
    Board:     ['Time', 'Name', 'Topic', 'Message', 'Approved'],
    Errors:    ['Time', 'Kind', 'Detail']
  };
  Object.keys(spec).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(spec[name]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, spec[name].length).setFontWeight('bold').setBackground('#f3ecdf');
      sh.setColumnWidth(1, 150);
    }
  });
  var d = ss.getSheetByName('Digest') || ss.insertSheet('Digest');
  if (d.getLastRow() === 0) {
    d.appendRow(['Time', 'Inquiries', 'Feedback', 'Board awaiting approval']);
    d.setFrozenRows(1);
  }
  ensureTriggers_();                           // daily 9pm digest, auto-rearmed
  return 'setup ok';
}

/* ------------------------------------------------------------------ get */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.type === 'board') return json(boardFeed());
  if (p.type === 'counts') return json(counts());
  if (p.type === 'ping') return json({ ok: true, t: stamp() });
  return json({ ok: true, service: 'prajna-capture' });
}

/* ----------------------------------------------------------------- post */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);                       // serialise concurrent writes
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var ss = SpreadsheetApp.getActive();
    var kind = String(d.type || 'inquiry');
    var row;

    if (kind === 'visit') {
      appendRow(ss, 'Visits', ['Time','Event','Page','Referrer','UTM Source','UTM Medium','UTM Campaign','Screen','Language','Detail'],
        [stamp(), cut(d.event, 20), cut(d.page, 80), cut(d.ref, 120), cut(d.src, 40), cut(d.med, 40), cut(d.cmp, 40), cut(d.screen, 12), cut(d.lang, 12), cut(d.extra, 120)]);
      rebuildStats_(ss);
      trim_(ss);
      return json({ ok: true });
    } else if (kind === 'board') {
      row = [stamp(), cut(d.name, 60), cut(d.topic, 30) || 'General', cut(d.message, 500), false];
      appendRow(ss, 'Board', ['Time','Name','Topic','Message','Approved'], row);
      notify_('New Pit post from ' + (cut(d.name, 60) || 'someone'), cut(d.message, 500));
    } else if (kind === 'feedback') {
      row = [stamp(), cut(d.name, 60) || 'Anonymous', cut(d.role, 20), cut(d.rating, 3), cut(d.message, 600), false];
      appendRow(ss, 'Feedback', ['Time','Name','Role','Rating','Message','Published'], row);
      var stars = Number(d.rating) || 0;
      if (stars > 0 && stars <= 3) notify_('Low rating (' + stars + '/5) — worth a call back', cut(d.message, 600));
    } else {
      row = [stamp(), cut(d.name, 60), cut(d.phone, 20), cut(d.interest, 30), cut(d.movein, 30), cut(d.message, 400),
             cut(d.source, 40) || 'website', 'NEW', ''];
      appendRow(ss, 'Inquiries', ['Time','Name','Phone','Interest','Move-in','Message','Source','Status','Notes'], row);
      notify_('Enquiry: ' + (cut(d.name, 60) || 'no name') + ' · ' + (cut(d.phone, 20) || 'no number'),
              [cut(d.interest, 30), cut(d.movein, 30), cut(d.message, 400)].filter(String).join(' | '));
    }

    trim_(ss);
    return json({ ok: true, t: stamp() });
  } catch (err) {
    try {
      var ss2 = SpreadsheetApp.getActive();
      appendRow(ss2, 'Errors', ['Time','Kind','Detail'], [stamp(), 'doPost', String(err).slice(0, 300)]);
    } catch (ignored) {}
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

/* ------------------------------------------------------------ helpers */
function boardFeed() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Board');
  var out = [];
  if (!sh || sh.getLastRow() < 2) return out;
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1 && out.length < 50; i--) {
    if (data[i][4] === true) {
      out.push({ name: String(data[i][1]), topic: String(data[i][2]), message: String(data[i][3]) });
    }
  }
  return out;
}

function counts() {
  var ss = SpreadsheetApp.getActive();
  return {
    open: sheetCount_(ss, 'Inquiries'),
    feedback: sheetCount_(ss, 'Feedback'),
    pending: pendingPosts_(ss)
  };
}

function sheetCount_(ss, name) {
  var sh = ss.getSheetByName(name);
  return sh ? Math.max(0, sh.getLastRow() - 1) : 0;
}

function pendingPosts_(ss) {
  var sh = ss.getSheetByName('Board');
  if (!sh || sh.getLastRow() < 2) return 0;
  var vals = sh.getRange(2, 5, sh.getLastRow() - 1, 1).getValues();
  var n = 0;
  for (var i = 0; i < vals.length; i++) if (vals[i][0] !== true) n++;
  return n;
}

function appendRow(ss, name, headers, row) {
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  sh.appendRow(row.map(function (v) { return v; }));
}

function trim_(ss) {
  ['Inquiries', 'Feedback', 'Board', 'Errors'].forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() > MAX_ROWS) {
      sh.deleteRows(2, 5000);                  // drop oldest 5k, keep header
    }
  });
}

function notify_(subject, body) {
  if (!DIGEST_TO || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(DIGEST_TO)) return;
  try { MailApp.sendEmail(DIGEST_TO, '[Prajna] ' + subject, body + '\n\n' + stamp()); }
  catch (ignored) {}
}

/* Daily digest — set a time trigger on this function, e.g. 8pm IST */
function digest() {
  var ss = SpreadsheetApp.getActive();
  appendRow(ss, 'Digest', ['Time','Inquiries','Feedback','Board awaiting approval'],
    [stamp(), sheetCount_(ss, 'Inquiries'), sheetCount_(ss, 'Feedback'), pendingPosts_(ss)]);
  if (DIGEST_TO) {
    notify_('Daily roll-up',
      'Total enquiries: ' + sheetCount_(ss, 'Inquiries') +
      '\nTotal feedback: ' + sheetCount_(ss, 'Feedback') +
      '\nBoard posts awaiting your approval: ' + pendingPosts_(ss) +
      '\nVisits logged: ' + sheetCount_(ss, 'Visits') +
      '\nWhatsApp clicks: ' + countEvent_(ss, 'wa_click') +
      '\nTop pages: ' + (topPages_(ss, 3).join(', ') || 'none yet') +
      '\n\nOpen "Prajna Data" to review.');
  }
}

function rebuildStats_(ss) {
  var sh = ss.getSheetByName('Visits');
  var st = ss.getSheetByName('Stats') || ss.insertSheet('Stats');
  if (st.getLastRow() > 0) st.clearContents();
  st.appendRow(['Signal', 'Key', 'Count', 'Meaning']);
  if (!sh) return;
  var vals = sh.getDataRange().getValues(), pv = {}, ev = {}, src = {};
  for (var i = 1; i < vals.length; i++) {
    var e = String(vals[i][1]), p = String(vals[i][2]) || '/', s = String(vals[i][4]) || '';
    if (e === 'page_view') { pv[p] = (pv[p] || 0) + 1; }
    else { ev[e] = (ev[e] || 0) + 1; ev[e + ' · ' + p] = (ev[e + ' · ' + p] || 0) + 1; }
    if (s) src[s] = (src[s] || 0) + 1;
  }
  var MEAN = { page_view: 'Page visits', wa_click: 'WhatsApp taps', cta_click: 'Button taps',
    share_tap: 'Shares sent', gallery_open: 'Photos opened', call_tap: 'Call taps', dwell: 'Time on page' };
  Object.keys(pv).sort(function(a,b){ return pv[b]-pv[a]; }).forEach(function(k){
    st.appendRow(['page_view', k, pv[k], MEAN.page_view]); });
  Object.keys(ev).sort(function(a,b){ return ev[b]-ev[a]; }).forEach(function(k){
    st.appendRow([k.split(' · ')[0], k, ev[k], MEAN[k.split(' · ')[0]] || 'Intent']); });
  Object.keys(src).sort(function(a,b){ return src[b]-src[a]; }).forEach(function(k){
    st.appendRow(['source', k, src[k], 'Channel: ' + k]); });
}

function ensureTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === 'digest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('digest').timeBased().everyDays(1).atHour(21).create();
}

function topPages_(ss, n) {
  var sh = ss.getSheetByName('Visits');
  if (!sh) return [];
  var vals = sh.getDataRange().getValues(), m = {};
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][1]) !== 'page_view') continue;
    var p = String(vals[i][2]) || '/';
    m[p] = (m[p] || 0) + 1;
  }
  return Object.keys(m).sort(function(a,b){ return m[b]-m[a]; }).slice(0, n)
    .map(function(p){ return p + ' (' + m[p] + ')'; });
}

function countEvent_(ss, ev) {
  var sh = ss.getSheetByName('Visits');
  if (!sh) return 0;
  var vals = sh.getDataRange().getValues(), n = 0;
  for (var i = 1; i < vals.length; i++) if (String(vals[i][1]) === ev) n++;
  return n;
}

function stamp() {
  return Utilities.formatDate(new Date(), TZ, 'dd MMM yyyy, HH:mm');
}

function cut(v, n) {
  return String(v === undefined || v === null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
