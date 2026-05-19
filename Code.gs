// ============================================================
// IT Ticketing System — Google Apps Script Backend
// Deploy as: Web App → Execute as: Me → Access: Anyone
// ============================================================

const SHEET_NAME = "Tickets";
const ALLOWED_EMAILS = []; // Leave empty to allow all @nationstar.ph + your personal gmail
const PERSONAL_GMAIL = ""; // e.g. "youremail@gmail.com" — fill this in
const COMPANY_DOMAIN = "nationstar.ph";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const params = e.parameter;
    const action = params.action;
    const userEmail = params.userEmail || "";

    // Auth check
    if (!isAllowedEmail(userEmail)) {
      output.setContent(JSON.stringify({ success: false, error: "Unauthorized email: " + userEmail }));
      return output;
    }

    let result;
    switch (action) {
      case "getTickets":
        result = getTickets();
        break;
      case "createTicket":
        result = createTicket(params);
        break;
      case "updateTicket":
        result = updateTicket(params);
        break;
      case "closeTicket":
        result = closeTicket(params);
        break;
      case "deleteTicket":
        result = deleteTicket(params);
        break;
      default:
        result = { success: false, error: "Unknown action: " + action };
    }

    output.setContent(JSON.stringify(result));
  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.toString() }));
  }

  return output;
}

function isAllowedEmail(email) {
  if (!email) return false;
  if (PERSONAL_GMAIL && email === PERSONAL_GMAIL) return true;
  if (email.endsWith("@" + COMPANY_DOMAIN)) return true;
  if (ALLOWED_EMAILS.includes(email)) return true;
  return false;
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Create header row
    sheet.getRange(1, 1, 1, 11).setValues([[
      "Date", "Start Time", "Employee Name", "Department",
      "Category", "Issue Summary", "End Time", "Resolution Time",
      "Status", "Remarks", "Ticket ID"
    ]]);
    sheet.getRange(1, 1, 1, 11).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getTickets() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, tickets: [] };

  const headers = data[0];
  const tickets = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[10]) continue; // skip rows without ticket ID
    tickets.push({
      row: i + 1,
      date: row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
      startTime: row[1] || "",
      employeeName: row[2] || "",
      department: row[3] || "",
      category: row[4] || "",
      issueSummary: row[5] || "",
      endTime: row[6] || "",
      resolutionTime: row[7] || "",
      status: row[8] || "Open",
      remarks: row[9] || "",
      ticketId: row[10] || ""
    });
  }

  // Sort by date desc, then start time desc
  tickets.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.startTime.localeCompare(a.startTime);
  });

  return { success: true, tickets };
}

function createTicket(params) {
  const sheet = getSheet();
  const now = new Date();
  const tz = Session.getScriptTimeZone();

  const date = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  const startTime = Utilities.formatDate(now, tz, "HH:mm:ss");
  const ticketId = "TKT-" + Utilities.formatDate(now, tz, "yyyyMMdd") + "-" + Math.floor(Math.random() * 9000 + 1000);

  const newRow = [
    date,
    startTime,
    params.employeeName || "",
    params.department || "",
    params.category || "",
    params.issueSummary || "",
    "",   // End Time — empty until closed
    "",   // Resolution Time — empty until closed
    "Open",
    params.remarks || "",
    ticketId
  ];

  sheet.appendRow(newRow);
  return { success: true, ticketId, startTime, date };
}

function updateTicket(params) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][10] === params.ticketId) {
      const rowNum = i + 1;
      if (params.employeeName !== undefined) sheet.getRange(rowNum, 3).setValue(params.employeeName);
      if (params.department !== undefined) sheet.getRange(rowNum, 4).setValue(params.department);
      if (params.category !== undefined) sheet.getRange(rowNum, 5).setValue(params.category);
      if (params.issueSummary !== undefined) sheet.getRange(rowNum, 6).setValue(params.issueSummary);
      if (params.remarks !== undefined) sheet.getRange(rowNum, 10).setValue(params.remarks);
      if (params.status !== undefined) sheet.getRange(rowNum, 9).setValue(params.status);
      return { success: true };
    }
  }

  return { success: false, error: "Ticket not found: " + params.ticketId };
}

function closeTicket(params) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const tz = Session.getScriptTimeZone();

  for (let i = 1; i < data.length; i++) {
    if (data[i][10] === params.ticketId) {
      const rowNum = i + 1;
      const now = new Date();
      const endTime = Utilities.formatDate(now, tz, "HH:mm:ss");

      // Calculate resolution time
      const startTimeStr = data[i][1];
      const dateStr = data[i][0];
      let resolutionTime = "";

      try {
        const startDate = new Date(dateStr + " " + startTimeStr);
        const diffMs = now - startDate;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        resolutionTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      } catch (e) {
        resolutionTime = "N/A";
      }

      sheet.getRange(rowNum, 7).setValue(endTime);
      sheet.getRange(rowNum, 8).setValue(resolutionTime);
      sheet.getRange(rowNum, 9).setValue("Closed");
      if (params.remarks) sheet.getRange(rowNum, 10).setValue(params.remarks);
      if (params.issueSummary) sheet.getRange(rowNum, 6).setValue(params.issueSummary);
      if (params.employeeName) sheet.getRange(rowNum, 3).setValue(params.employeeName);
      if (params.department) sheet.getRange(rowNum, 4).setValue(params.department);
      if (params.category) sheet.getRange(rowNum, 5).setValue(params.category);

      return { success: true, endTime, resolutionTime };
    }
  }

  return { success: false, error: "Ticket not found: " + params.ticketId };
}

function deleteTicket(params) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][10] === params.ticketId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: "Ticket not found" };
}
