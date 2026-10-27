/**
 * Amplitude Studios (demo) — Google Apps Script backend.
 *
 * Deploy: paste into a new Apps Script project, fill CONFIG, then
 * Deploy > New deployment > Web app, Execute as Me, access Anyone.
 * Paste the /exec URL into CONFIG.APPS_SCRIPT_URL in index.html.
 *
 * What it does:
 * - Appends every booking / lead / payment event to a "Bookings" tab.
 * - Creates ONE calendar event per booking ref (updates in place on
 *   later status posts, never duplicates).
 * - Emails the studio on every event and the customer on paid or
 *   invoice-requested events.
 */
var CONFIG = {
  STUDIO_EMAIL: 'PASTE_STUDIO_EMAIL',
  CALENDAR_ID: 'PASTE_CALENDAR_ID',
  BUSINESS_NAME: 'Amplitude Studios',
  SHEET_NAME: 'Bookings'
};

function doPost(e) {
  var out = { ok: true };
  try {
    var data = JSON.parse(e.postData.contents);
    writeRow_(data);
    upsertCalendarEvent_(data);
    notify_(data);
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // Availability endpoint. Demo version: no busy slots are reported and
  // the front end works from its own slot list. Wire real calendar
  // free/busy here when a studio goes live.
  if (e && e.parameter && e.parameter.action === 'slots') {
    return ContentService
      .createTextOutput(JSON.stringify({ slots: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('ok');
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(['Timestamp', 'Ref', 'Status', 'Pay method', 'Name', 'Artist', 'Email', 'Phone',
      'Project', 'Session', 'Room', 'Hours', 'Songs', 'Add-ons', 'Date', 'Time',
      'Total', 'Deposit', 'Notes']);
  }
  return sh;
}

function writeRow_(d) {
  sheet_().appendRow([
    new Date(), d.ref || '', d.status || '', d.payMethod || '',
    d.fullName || '', d.artistName || '', d.email || '', d.phone || '',
    d.project || '', d.sessionType || '', d.room || '', d.hours || '', d.songs || '',
    (d.addons || []).join('; '), d.date || '', d.time || '',
    d.total || '', d.deposit || '', d.notes || ''
  ]);
}

function upsertCalendarEvent_(d) {
  if (!d.date || !d.time || !d.ref) return;
  if (CONFIG.CALENDAR_ID.indexOf('PASTE_') === 0) return;
  var cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!cal) return;
  var start = new Date(d.date + 'T' + d.time + ':00');
  var hours = Number(d.hours) || 1;
  var end = new Date(start.getTime() + hours * 3600 * 1000);
  var title = CONFIG.BUSINESS_NAME + ' · ' + (d.sessionType || 'Session') + ' · ' + d.ref;
  var existing = cal.getEvents(start, new Date(start.getTime() + 24 * 3600 * 1000));
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getTitle().indexOf(d.ref) !== -1) {
      existing[i].setTitle(title);
      existing[i].setTime(start, end);
      return;
    }
  }
  cal.createEvent(title, start, end, {
    description: 'Artist: ' + (d.artistName || d.fullName || '') +
      '\nContact: ' + (d.email || '') + ' / ' + (d.phone || '') +
      '\nTotal: ' + (d.total || '') + ' · Deposit: ' + (d.deposit || '') +
      '\nStatus: ' + (d.status || '')
  });
}

function notify_(d) {
  if (CONFIG.STUDIO_EMAIL.indexOf('PASTE_') === 0) return;
  var subject = CONFIG.BUSINESS_NAME + ' · ' + (d.status || 'booking') + ' · ' + (d.ref || '');
  var body = [
    'Ref: ' + (d.ref || ''),
    'Status: ' + (d.status || '') + (d.payMethod ? ' (' + d.payMethod + ')' : ''),
    'Name: ' + (d.fullName || ''),
    'Artist: ' + (d.artistName || ''),
    'Email: ' + (d.email || ''),
    'Phone: ' + (d.phone || ''),
    'Project: ' + (d.project || ''),
    'Session: ' + (d.sessionType || ''),
    'Room: ' + (d.room || '') + ' · Hours: ' + (d.hours || '') + ' · Songs: ' + (d.songs || ''),
    'Add-ons: ' + (d.addons || []).join('; '),
    'When: ' + (d.date || '') + ' ' + (d.time || ''),
    'Total: ' + (d.total || '') + ' · Deposit: ' + (d.deposit || ''),
    'Notes: ' + (d.notes || '')
  ].join('\n');
  MailApp.sendEmail(CONFIG.STUDIO_EMAIL, subject, body);

  var customerStatuses = { 'paid-marked': true, 'invoice-requested': true };
  if (d.email && customerStatuses[d.status]) {
    MailApp.sendEmail(d.email,
      CONFIG.BUSINESS_NAME + ' · Booking ' + (d.ref || ''),
      'You are booked in.\n\n' + body + '\n\nThe studio confirms every booking personally.');
  }
}
