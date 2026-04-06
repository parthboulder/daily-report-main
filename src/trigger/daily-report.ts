import { logger, task, schedules } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";

// Clients are lazy-initialized at runtime (not import time) so env vars are available
function getEnv() {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    GOTENBERG_URL: process.env.GOTENBERG_URL || "",
    GOTENBERG_AUTH: process.env.GOTENBERG_AUTH || "",
    COMPRESS_URL: process.env.COMPRESS_URL || "",
    CLAUDE_API_KEY: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || "",
    MS_TENANT_ID: process.env.AZURE_TENANT_ID || process.env.MS_TENANT_ID || "",
    MS_CLIENT_ID: process.env.AZURE_CLIENT_ID || process.env.MS_CLIENT_ID || "",
    MS_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET || process.env.MS_CLIENT_SECRET || "",
    MS_SENDER_EMAIL: process.env.MS_SENDER_EMAIL || "smit@boulderconstruction.com",
  };
}

function getSupabase() {
  const env = getEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

function getAnthropic() {
  return new Anthropic({ apiKey: getEnv().CLAUDE_API_KEY });
}

// --- Types ---

interface DailySiteReport {
  id: number;
  date: string | null;
  submitted_by: string[] | null;
  projects: string[] | null;
  photos: Array<{ url: string; filename: string; thumbnails?: { large?: { url: string } } }> | null;
  manpower: string | null;
  work_in_progress: string | null;
  work_completed_today: string | null;
  work_planned_tomorrow: string | null;
  deliveries: string | null;
  issues_delays: string | null;
  inspection_today_upcoming_with_status: string | null;
  weather: string | null;
  notes: string | null;
  rfis: string | null;
  change_orders: string | null;
  requests_notices: string | null;
  receipts: Array<any> | null;
  receipts_context: string | null;
  include_in_weekly_report: boolean;
  generate_daily_report: boolean;
  report_status: string | null;
  report_sent_at: string | null;
  airtable_record_id: string | null;
  equipment_attachments: Array<any> | null;
  created_at: string;
  updated_at: string;
}

interface NormalizedReport {
  recordId: number;
  reportDate: string;
  reportDateShort: string;
  projectName: string;
  projectCode: string;
  weather: string;
  manpower: string;
  workInProgress: string;
  workCompletedToday: string;
  workPlannedTomorrow: string;
  deliveries: string;
  issues: string;
  delays: string;
  inspections: string;
  notes: string;
  rfis: string;
  changeOrders: string;
  requestsNotices: string;
  receiptsCount: number;
  photos: Array<{ url: string; filename: string }>;
  totalPhotos: number;
}

// --- Helpers ---

async function getGraphAccessToken(): Promise<string> {
  const env = getEnv();
  const tokenUrl = `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    client_secret: env.MS_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const res = await axios.post(tokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data.access_token;
}

async function sendEmailWithGraph(
  accessToken: string,
  to: string,
  cc: string,
  subject: string,
  body: string,
  pdfBuffer: Buffer,
  pdfFilename: string
): Promise<void> {
  const toRecipients = to.split(",").map(e => e.trim()).filter(Boolean).map(email => ({
    emailAddress: { address: email },
  }));

  const ccRecipients = cc
    ? cc.split(",").map(e => e.trim()).filter(Boolean).map(email => ({
        emailAddress: { address: email },
      }))
    : [];

  const attachments = pdfBuffer.length > 0 && pdfFilename
    ? [
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: pdfFilename,
          contentType: "application/pdf",
          contentBytes: pdfBuffer.toString("base64"),
        },
      ]
    : [];

  const senderEmail = getEnv().MS_SENDER_EMAIL;
  const message: any = {
    message: {
      subject,
      body: { contentType: "Text", content: body },
      from: { emailAddress: { address: senderEmail } },
      toRecipients,
      ccRecipients,
      attachments,
    },
    saveToSentItems: "true",
  };

  await axios.post(
    `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
    message,
    { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
  );
}

function getYesterdayDate(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  now.setDate(now.getDate() - 1);
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function formatDateLong(dateStr: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}/${parts[2]}/${parts[0].substring(2)}`;
}

function formatDateDDMMYYYY(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function hasContent(val: any): boolean {
  const s = safeStr(val).trim();
  return s.length > 0 && !["[]", "{}", "null", "undefined", "None", "N/A"].includes(s);
}

function parseEmailList(emailStr: string): string[] {
  if (!emailStr || !emailStr.trim()) {
    return [];
  }

  return emailStr
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

function parseIssuesAndDelays(issuesDelaysText: string): { issues: string; delays: string } {
  if (!issuesDelaysText || !issuesDelaysText.trim()) {
    return { issues: "", delays: "" };
  }

  const blocks = issuesDelaysText.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean);
  const issuesBlocks: string[] = [];
  const delaysBlocks: string[] = [];

  for (const block of blocks) {
    const firstLine = block.split('\n')[0] || '';
    if (/^Delay\s*-\s*/i.test(firstLine)) {
      delaysBlocks.push(block);
    } else {
      issuesBlocks.push(block);
    }
  }

  return {
    issues: issuesBlocks.join('\n\n'),
    delays: delaysBlocks.join('\n\n'),
  };
}

function normalizeEmailList(emails: string[]): string {
  return emails.join(", ");
}

function filterEmailListByDomain(emails: string[], domain: string): string[] {
  if (!domain || !domain.trim()) {
    return emails;
  }

  const normalizedDomain = domain.trim().toLowerCase().replace(/^@/, "");
  return emails.filter((email) => {
    const e = email.trim().toLowerCase();
    return e.endsWith("@" + normalizedDomain);
  });
}

function toParagraph(val: any): string {
  if (!hasContent(val)) return "";
  const s = safeStr(val).trim();
  const lines = s.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  return lines.map(l => `<p>${l}</p>`).join("");
}

function buildHTML(report: NormalizedReport, polished: any): string {
  const fieldMap = [
    { key: "weather", label: "Weather" },
    { key: "manpower", label: "Manpower" },
    { key: "workCompletedToday", label: "Work Completed Today" },
    { key: "workInProgress", label: "Work in Progress" },
    { key: "workPlannedTomorrow", label: "Work Planned Tomorrow" },
    { key: "deliveries", label: "Deliveries" },
    { key: "inspections", label: "Inspections" },
    { key: "issues", label: "Issues" },
    { key: "delays", label: "Delays" },
    { key: "rfis", label: "RFIs" },
    { key: "changeOrders", label: "Change Orders" },
    { key: "requestsNotices", label: "Requests & Notices" },
    { key: "notes", label: "Notes" }
  ];

  let sections = "";
  for (const f of fieldMap) {
    const val = polished[f.key];
    if (hasContent(val)) {
      sections += `<div class="sec"><div class="label">${f.label}</div>${toParagraph(val)}</div>`;
    }
  }

  if (report.receiptsCount > 0) {
    sections += `<div class="sec"><div class="label">Receipts</div><p>${report.receiptsCount} receipt(s) uploaded</p></div>`;
  }

  let summarySec = "";
  if (hasContent(polished.overallSummary)) {
    summarySec = `<div class="summary"><div class="summary-tag">Summary</div>${toParagraph(polished.overallSummary)}</div>`;
  }

  let photoSec = "";
  if (report.photos.length > 0) {
    let cells = "";
    for (const p of report.photos) {
      cells += `<div class="ph"><img src="${p.url}" /><span>${p.filename}</span></div>`;
    }
    photoSec = `<div class="photo-page"><div class="label">Site Photos</div><div class="pgrid">${cells}</div></div>`;
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 landscape;
    margin: 12mm 12mm 12mm 12mm;
    @bottom-center { content: "Page " counter(page); }
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    width: 100%;
    height: 100%;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1F2937;
    font-size: 9.5pt;
    line-height: 1.5;
    background: #fff;
  }
  .page {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    grid-auto-flow: dense;
  }
  .hdr {
    grid-column: 1;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 2px solid #D4772C;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 16px;
    align-items: center;
  }
  .hdr-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .brand {
    font-size: 8pt;
    font-weight: 900;
    color: #D4772C;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .title {
    font-size: 16pt;
    font-weight: 700;
    color: #1F2937;
    line-height: 1;
  }
  .hdr-info {
    display: flex;
    gap: 20px;
    justify-self: end;
    text-align: right;
  }
  .project-date {
    font-size: 9pt;
    color: #6B7280;
    font-weight: 600;
    line-height: 1.3;
  }
  .accent-bar {
    display: none;
  }
  .content-wrapper {
    grid-column: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sec {
    page-break-inside: avoid;
  }
  .label {
    font-size: 8.5pt;
    font-weight: 700;
    color: #D4772C;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  p {
    font-size: 9.5pt;
    color: #374151;
    margin: 0;
    line-height: 1.5;
    text-align: left;
  }
  .summary {
    grid-column: 1 / -1;
    margin: 0 0 12px 0;
    padding: 10px 12px;
    background: #FEF3E2;
    border-left: 3px solid #D4772C;
    page-break-inside: avoid;
  }
  .summary-tag {
    font-size: 7.5pt;
    font-weight: 700;
    color: #D4772C;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .photo-page {
    grid-column: 1 / -1;
    margin-top: 12px;
    page-break-inside: avoid;
  }
  .pgrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 8px;
  }
  .ph {
    page-break-inside: avoid;
  }
  .ph img {
    width: 100%;
    height: 90px;
    object-fit: cover;
    border-radius: 2px;
    display: block;
    border: 1px solid #E5E7EB;
  }
  .ph span {
    display: block;
    font-size: 7pt;
    color: #9CA3AF;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .foot {
    grid-column: 1 / -1;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #E5E7EB;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #9CA3AF;
    page-break-inside: avoid;
  }
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="hdr-left">
      <div class="brand">Boulder</div>
      <div class="title">Daily Report</div>
    </div>
    <div></div>
    <div class="hdr-info">
      <div>
        <div class="project-date" style="font-weight: 700;">${report.projectName}</div>
        <div class="project-date">${report.reportDate}</div>
      </div>
    </div>
  </div>
  ${summarySec}
  <div class="content-wrapper">
    <div class="col">
      ${sections.split('<div class="sec">').slice(0, Math.ceil((sections.split('<div class="sec">').length - 1) / 2)).map(s => s ? '<div class="sec">' + s : '').join('')}
    </div>
    <div class="col">
      ${sections.split('<div class="sec">').slice(Math.ceil((sections.split('<div class="sec">').length - 1) / 2)).map(s => s ? '<div class="sec">' + s : '').join('')}
    </div>
  </div>
  ${photoSec}
  <div class="foot">
    <span>© Boulder Construction</span>
    <span>${report.projectName} • ${report.reportDate}</span>
  </div>
</div>
</body>
</html>`;
}

// --- Core workflow function (shared by scheduled + manual trigger) ---

interface RunWorkflowOptions {
  emailTo?: string
  emailCc?: string
  emailToJson?: string
  emailCcJson?: string
  skipMissing?: boolean
}

async function runDailyReportWorkflow(options: RunWorkflowOptions = {}): Promise<{ success: boolean; message: string; recordsProcessed: number }> {
  logger.log("[WORKFLOW] Running daily report workflow", { options });

  const env = getEnv();
  const supabase = getSupabase();
  const anthropic = getAnthropic();

  const emailTo = options.emailTo ? options.emailTo.trim() : ""
  const emailCc = options.emailCc ? options.emailCc.trim() : ""

  const jsonTo = options.emailToJson ? JSON.parse(options.emailToJson) : []
  const jsonCc = options.emailCcJson ? JSON.parse(options.emailCcJson) : []
  if (Array.isArray(jsonTo) && jsonTo.length > 0) {
    logger.log("Overriding emailTo from JSON list", { jsonTo })
  }
  if (Array.isArray(jsonCc) && jsonCc.length > 0) {
    logger.log("Overriding emailCc from JSON list", { jsonCc })
  }

  const toList = Array.isArray(jsonTo) && jsonTo.length > 0 ? jsonTo : parseEmailList(emailTo)
  const ccList = Array.isArray(jsonCc) && jsonCc.length > 0 ? jsonCc : parseEmailList(emailCc)

  // Optional domain restriction (default to ridgelabs.ai if configured or requested).
  const allowedEmailDomain = (process.env.ALLOWED_EMAIL_DOMAIN || "ridgelabs.ai").trim().toLowerCase();

  const filteredToList = filterEmailListByDomain(toList, allowedEmailDomain)
  const filteredCcList = filterEmailListByDomain(ccList, allowedEmailDomain)

  const finalEmailTo = normalizeEmailList(filteredToList)
  const finalEmailCc = normalizeEmailList(filteredCcList)

  logger.log("[WORKFLOW] Allowed email domain for recipients", { allowedEmailDomain })
  logger.log("[WORKFLOW] Email recipients before filtering", { toList, ccList })
  logger.log("[WORKFLOW] Email recipients after filtering", { finalEmailTo, finalEmailCc })

  // Step 1: Fetch records from Supabase
  const reportDate = getYesterdayDate();
  logger.log(`Fetching records for date: ${reportDate}`);

  const { data: records, error } = await supabase
    .from("daily_site_report")
    .select("*")
    .or(`date.eq.${reportDate},generate_daily_report.eq.true`)
    .not("report_status", "in", '("Sent","Failed")')
    .not("projects", "is", null);

  if (error) {
    logger.error("Supabase fetch error:", { error });
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  const allRecords = (records || []) as DailySiteReport[];
  logger.log(`Fetched ${allRecords.length} records from Supabase`);

  const filtered = allRecords.filter(r => r.projects && r.projects.length > 0);

  // Step 2: Check for missing project reports
  const ACTIVE_PROJECTS = [
    "Hampton Inn – Baton Rouge",
    "Candlewood Suites – Jackson",
    "TownePlace Suites – Jackson",
    "Staybridge Suites – Jackson",
    "Homewood Suites – Gonzales",
    "Holiday Inn Express – Stephenville",
  ];

  const submittedRecords = allRecords.filter(r => 
    r.projects && 
    r.projects.length > 0 && 
    (r.report_status === 'Submitted' || r.report_status === 'Sent')
  );
  const submittedProjects = submittedRecords.map(r => (r.projects && r.projects[0]) || "");

  const missingProjects = ACTIVE_PROJECTS.filter(
    project => !submittedProjects.includes(project)
  );

  if (!options.skipMissing && missingProjects.length > 0) {
    if (!finalEmailTo.trim()) {
      logger.log("No TO recipients selected, skipping missing report notifications");
    } else {
      logger.log(`Missing reports for: ${missingProjects.join(", ")}`);
      try {
        const accessToken = await getGraphAccessToken();
        for (const project of missingProjects) {
          try {
            logger.log("[WORKFLOW][MISSING] Sending missing report email", { project, finalEmailTo, finalEmailCc });
            await sendEmailWithGraph(
              accessToken,
              finalEmailTo,
              finalEmailCc,
              `Missing Daily Report - ${project} - ${formatDateLong(reportDate)}`,
              `Hi Team,\n\nThe Daily Progress Report for ${project}, dated ${formatDateLong(reportDate)}, was not received yesterday. Please submit it at the earliest.\n\nThank you.`,
              Buffer.alloc(0),
              ""
            );
            logger.log(`Missing report notification sent for ${project}`);
          } catch (emailError) {
            logger.error("Failed to send missing report notification for project", { project, emailError });
          }
        }
      } catch (emailError) {
        logger.error("Failed to get Graph access token for missing reports", { emailError });
      }
    }
  }

  if (filtered.length === 0) {
    logger.log("No eligible records found for report generation");

    // Optional: send a notification email when no records are available
    if (emailTo.trim()) {
      try {
        const accessToken = await getGraphAccessToken();
        await sendEmailWithGraph(
          accessToken,
          emailTo,
          emailCc,
          `Daily Report Run - No Records Found (${reportDate})`,
          `Hi Team,\n\nThe daily report workflow was run for ${reportDate}, but no eligible records were found.\n\nThis is an automated notification.\n`,
          Buffer.alloc(0),
          ""
        );
        logger.log("No-records notification email sent");
      } catch (emailError) {
        logger.error("Failed to send no-records notification email", { emailError });
      }
    } else {
      logger.log("No TO recipients selected, skipping no-records notification");
    }

    return { success: false, message: "No records found", recordsProcessed: 0 };
  }

  // Project code to full name mapping for consistent display
  const PROJECT_CODE_TO_NAME: Record<string, string> = {
    "TPSJ": "TownePlace Suites – Jackson",
    "SYBJ": "Staybridge Suites – Jackson",
    "CWSJ": "Candlewood Suites – Jackson",
    "HIS":  "Holiday Inn Express – Stephenville",
    "HIBR": "Hampton Inn – Baton Rouge",
    "HWSG": "Homewood Suites – Gonzales",
  };

  // Step 3: Normalize records
  const normalizedRecords: NormalizedReport[] = filtered.map(r => {
    const dateStr = r.date ? r.date.substring(0, 10) : reportDate;
    const photos = Array.isArray(r.photos)
      ? r.photos.map(p => ({
          url: p?.thumbnails?.large?.url || p?.url || "",
          filename: p?.filename || "photo.jpg"
        }))
      : [];

    const receiptsCount = Array.isArray(r.receipts) ? r.receipts.length : 0;
    const { issues, delays } = parseIssuesAndDelays(r.issues_delays || "");

    return {
      recordId: r.id,
      reportDate: formatDateDDMMYYYY(dateStr),
      reportDateShort: formatDateShort(dateStr),
      projectName: r.projects ? r.projects.map(code => PROJECT_CODE_TO_NAME[code] || code).join(", ") : "",
      projectCode: r.projects ? r.projects[0] : "",
      weather: r.weather || "",
      manpower: r.manpower || "",
      workInProgress: r.work_in_progress || "",
      workCompletedToday: r.work_completed_today || "",
      workPlannedTomorrow: r.work_planned_tomorrow || "",
      deliveries: r.deliveries || "",
      issues: issues,
      delays: delays,
      inspections: r.inspection_today_upcoming_with_status || "",
      notes: r.notes || "",
      rfis: r.rfis || "",
      changeOrders: r.change_orders || "",
      requestsNotices: r.requests_notices || "",
      receiptsCount,
      photos,
      totalPhotos: photos.length,
    };
  });

  let processedCount = 0;

  for (const report of normalizedRecords) {
    logger.log(`Processing report for ${report.projectName}`);

    const hasReportContent = [
      report.weather, report.manpower, report.workInProgress,
      report.workCompletedToday, report.workPlannedTomorrow,
      report.deliveries, report.issues, report.delays, report.inspections,
      report.notes, report.rfis, report.changeOrders, report.requestsNotices
    ].some(val => hasContent(val));

    if (!hasReportContent) {
      logger.log(`Skipping ${report.projectName} — no report content`);
      continue;
    }

    if (!finalEmailTo.trim()) {
      logger.log(`Skipping ${report.projectName} — no TO recipients selected`);
      continue;
    }

    // Step 4: Generate AI summary
    logger.log("Generating AI summary...");
    const prompt = `You are a construction report editor for Boulder Construction. You receive raw daily site report data. Your job is to:

1. Fix all grammar, spelling, and punctuation errors in every field.
2. Rewrite each field in a clear, professional, human-readable way — proper sentences, no shorthand or abbreviations unless industry-standard (e.g. HVAC, MEP, GC are fine).
3. Keep the original meaning and all details intact — do not remove or add information.
4. Write a thorough "overallSummary" (3-6 sentences) that:
   - Opens with the most significant work accomplished that day
   - Mentions key trades active on site and what they progressed
   - Notes any inspections, deliveries, or milestones
   - Notes if any delays or issues are present (without details, as they are covered in separate fields)
   - Closes with what's coming next or the overall project trajectory
   - Uses professional but approachable tone, past tense for completed work

Return valid JSON with exactly these keys (corrected and humanized values):
weather, manpower, workInProgress, workCompletedToday, workPlannedTomorrow, deliveries, issues, delays, inspections, notes, rfis, changeOrders, requestsNotices, overallSummary

Raw data:
Weather: ${report.weather}
Manpower: ${report.manpower}
Work in Progress: ${report.workInProgress}
Work Completed Today: ${report.workCompletedToday}
Work Planned Tomorrow: ${report.workPlannedTomorrow}
Deliveries: ${report.deliveries}
issues: ${report.issues}
delays: ${report.delays}
Inspections: ${report.inspections}
Notes: ${report.notes}
RFIs: ${report.rfis}
Change Orders: ${report.changeOrders}
Requests & Notices: ${report.requestsNotices}

Output ONLY valid JSON, no markdown fences.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "{}";
    const polished = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());

    logger.log("Polished data for report", { project: report.projectName, polished });

    // Step 5: Build HTML
    logger.log("Building HTML report...");
    const html = buildHTML(report, polished);

    // Step 6: Convert to PDF via Gotenberg
    logger.log("Converting HTML to PDF via Gotenberg...");
    const htmlBuffer = Buffer.from(html, "utf-8");
    const formData = new FormData();
    const blob = new Blob([htmlBuffer], { type: "text/html" });
    formData.append("index.html", blob, "index.html");

    const pdfResponse = await axios.post(env.GOTENBERG_URL, formData, {
      headers: {
        "X-Auth": env.GOTENBERG_AUTH,
        "Content-Type": "multipart/form-data"
      },
      responseType: "arraybuffer"
    });

    let pdfBuffer = Buffer.from(pdfResponse.data);

    // Step 7: Compress PDF
    logger.log("Compressing PDF...");
    const compressResponse = await axios.post(env.COMPRESS_URL, pdfBuffer, {
      headers: { "Content-Type": "application/pdf" },
      responseType: "arraybuffer"
    });

    const compressedPDF = Buffer.from(compressResponse.data);

    // Step 8: Generate filename
    const dateParts = report.reportDateShort.split("/");
    const fileDate = dateParts.length === 3
      ? `20${dateParts[2]} ${dateParts[0]} ${dateParts[1]}`
      : report.reportDateShort;
    const safeFileName = `${fileDate} - Daily Report - ${report.projectName}`.replace(/[^a-zA-Z0-9\s\-\.]/g, "").trim() + ".pdf";

    logger.log(`PDF generated for ${report.projectName}: ${safeFileName} (${compressedPDF.length} bytes)`);

    // Step 9: Send email via Microsoft Graph API
    logger.log("Sending email via Microsoft Graph API...", { finalEmailTo, finalEmailCc });
    let accessToken: string;
    try {
      accessToken = await getGraphAccessToken();
    } catch (tokenError) {
      logger.error("Failed to get Graph access token", { tokenError });
      throw tokenError;
    }

    const emailSubject = `Daily Report - ${report.projectName} ${report.reportDate}`;
    const emailBody = `Hi Team,\n\nPlease find attached the Daily Progress Report for ${report.projectName}, dated ${report.reportDate}.\n\nThanks!\n\nSmit Patel\nBoulder Construction\nO: (214) 620-5512`;

    try {
      await sendEmailWithGraph(
        accessToken,
        finalEmailTo,
        finalEmailCc,
        emailSubject,
        emailBody,
        compressedPDF,
        safeFileName
      );
      logger.log(`Email sent for ${report.projectName}`);
    } catch (emailError) {
      logger.error("Failed to send Graph email", { project: report.projectName, finalEmailTo, finalEmailCc, emailError });
      throw emailError;
    }

    // Step 10: Update Supabase record status to "Sent"
    logger.log("Updating Supabase record status...");
    const { error: updateError } = await supabase
      .from("daily_site_report")
      .update({
        report_status: "Sent",
        report_sent_at: new Date().toISOString(),
        generate_daily_report: false,
      })
      .eq("id", report.recordId);

    if (updateError) {
      logger.error(`Failed to update record ${report.recordId}:`, { updateError });
    } else {
      logger.log(`Record ${report.recordId} marked as Sent`);
    }

    processedCount++;
  }

  logger.log("Workflow completed successfully");
  return { success: true, message: `Processed ${processedCount} reports`, recordsProcessed: processedCount };
}

// --- Scheduled task (runs on cron) ---

export const scheduledDailyReport = schedules.task({
  id: "scheduled-daily-report",
  run: async (payload) => {
    logger.log("[SCHEDULED] Running scheduled daily report", { payload });
    return await runDailyReportWorkflow();
  },
});

// --- Manual trigger task (called from admin UI) ---

export const manualDailyReport = task({
  id: "manual-daily-report",
  maxDuration: 3600,
  run: async (payload: { triggeredBy?: string; emailTo?: string; emailCc?: string }) => {
    logger.log("[MANUAL] Running manual daily report", { triggeredBy: payload.triggeredBy, emailTo: payload.emailTo, emailCc: payload.emailCc });
    return await runDailyReportWorkflow({ emailTo: payload.emailTo, emailCc: payload.emailCc, skipMissing: true });
  },
});
