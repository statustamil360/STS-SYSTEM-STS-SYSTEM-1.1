const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { listReports } = require('./clinicalReportService');
const { formatSequenceCode } = require('../utils/sequenceCode');
const { uploadDir } = require('../config/jwt');

const DOCUMENT_TITLE = 'Asterix Medical Center';
const DOCUMENT_SUBTITLE = 'Clinical Conference Report';
const COPYRIGHT = `© ${new Date().getFullYear()} | AMC Teleconference. All Rights Reserved.`;

const ROLE_STYLES = {
  gp: { bg: '#1A2433', fg: '#FFFFFF', label: 'GP' },
  ahp: { bg: '#50555C', fg: '#FFFFFF', label: 'AHP' },
  guest_gp: { bg: '#1B6CA8', fg: '#FFFFFF', label: 'Guest GP' },
  guest_ahp: { bg: '#1B6CA8', fg: '#FFFFFF', label: 'Guest AHP' },
};

const HEADING_BG = '#F2F5FA';
const HEADING_FG = '#1A2433';

const stripEmpty = (html) => (html && html !== '<p></p>' ? html : '');

const dash = (value) => {
  if (value === null || value === undefined) return '—';
  const text = String(value).trim();
  return text ? text : '—';
};

const escapeHtml = (value) => dash(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const formatGender = (gender) => {
  if (!gender) return '—';
  return String(gender).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatAge = (age) => {
  if (age === null || age === undefined || age === '') return '—';
  const years = Number(age);
  if (Number.isNaN(years) || years < 0) return '—';
  return `${years} year${years === 1 ? '' : 's'}`;
};

const formatDurationLabel = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
};

const formatTotalDuration = (seconds, startedTime, endedTime) => {
  if (seconds === null || seconds === undefined || Number(seconds) < 0) return '—';
  const label = formatDurationLabel(seconds);
  if (startedTime && endedTime) return `${label} (${startedTime} – ${endedTime})`;
  return label;
};

const buildConferenceFields = (conf) => ([
  ['Patient name', dash(conf.patient_name)],
  ['ID', dash(conf.patient_code)],
  ['Age', formatAge(conf.age)],
  ['Gender', formatGender(conf.gender)],
  ['Medical ID', dash(conf.medical_id)],
  ['Conference ID', dash(conf.conference_code)],
  ['Meeting date', dash(conf.meeting_date)],
  ['Time', dash(conf.meeting_time)],
  ['Total meeting duration', formatTotalDuration(conf.duration_seconds, conf.started_time, conf.ended_time)],
  ['Assigned receptionist', dash(conf.assigned_by_name)],
]);

const roleStyle = (role) => ROLE_STYLES[role] || ROLE_STYLES.ahp;

const roleSections = (role) => {
  if (['gp', 'guest_gp'].includes(role)) {
    return ['Assessment', 'Recommendations', 'Conclusion (Outcomes to be achieved)'];
  }
  return ['Recommendations'];
};

const sectionContent = (report, title) => {
  if (title === 'Assessment') return report.assessment;
  if (title === 'Recommendations') return report.recommendations;
  return report.conclusion;
};

const buildReportHtml = (conf, participants) => {
  const fields = buildConferenceFields(conf);
  const rows = [];
  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i];
    const right = fields[i + 1];
    rows.push(`
      <tr>
        <td class="label">${escapeHtml(left[0])}</td>
        <td>${escapeHtml(left[1])}</td>
        <td class="label">${right ? escapeHtml(right[0]) : ''}</td>
        <td>${right ? escapeHtml(right[1]) : ''}</td>
      </tr>
    `);
  }

  const participantList = participants.map((p) => {
    const style = roleStyle(p.role);
    return `<div class="name-bar" style="background:${style.bg};color:${style.fg};">
      ${escapeHtml(style.label)} · ${escapeHtml(p.display_name)}${p.detail ? ` · ${escapeHtml(p.detail)}` : ''}
    </div>`;
  }).join('');

  const participantBlocks = participants.map((p) => {
    const style = roleStyle(p.role);
    const report = p.report;
    return `
    <section class="report-block">
      <div class="name-bar" style="background:${style.bg};color:${style.fg};">
        ${escapeHtml(style.label)} · ${escapeHtml(report.display_name || p.display_name)}
      </div>
      ${roleSections(p.role).map((title) => `
        <div class="heading-bar">${escapeHtml(title)}</div>
        <div class="rich">${stripEmpty(sectionContent(report, title)) || '<p><em>Not documented</em></p>'}</div>
      `).join('')}
    </section>
  `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Calibri, Arial, sans-serif; color:#0F172A; margin:40px; font-size:12pt; line-height:1.55; }
    .header { text-align:center; border-bottom:3px solid #1E3A5F; padding-bottom:16px; margin-bottom:24px; }
    .header h1 { color:#1E3A5F; margin:0; font-size:22px; letter-spacing:0.5px; }
    .header .subtitle { color:#0D9488; margin:8px 0 0; font-size:13pt; font-weight:700; }
    .section-title { color:#1E3A5F; font-size:12pt; letter-spacing:0.08em; text-transform:uppercase; margin:0 0 10px; }
    .meta { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px; margin-bottom:22px; }
    .meta table { width:100%; border-collapse:collapse; }
    .meta td { padding:6px 8px; font-size:11pt; vertical-align:top; }
    .meta td.label { color:#64748B; width:18%; font-weight:600; }
    .title-block { margin:0 0 22px; }
    .title-block h2 { color:#1E3A5F; margin:0; font-size:16px; }
    .name-bar { padding:8px 12px; font-weight:700; font-size:11pt; margin:0 0 8px; }
    .heading-bar { background:${HEADING_BG}; color:${HEADING_FG}; padding:6px 12px; font-weight:700; font-size:10.5pt; margin:12px 0 8px; }
    .page-break { page-break-before: always; }
    .report-block { margin-bottom:28px; page-break-inside:avoid; }
    .footer { text-align:center; color:#64748B; font-size:9pt; margin-top:36px; border-top:1px solid #E2E8F0; padding-top:10px; }
    .rich p { margin:0 0 8px; }
    .rich ul, .rich ol { margin:0 0 8px 20px; }
    .rich strong { font-weight:700; }
    .rich em { font-style:italic; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(DOCUMENT_TITLE)}</h1>
    <p class="subtitle">${escapeHtml(DOCUMENT_SUBTITLE)}</p>
  </div>
  <p class="section-title">Conference Information</p>
  <div class="meta">
    <table>${rows.join('')}</table>
  </div>
  <div class="title-block">
    <p class="section-title">Conference Title</p>
    <h2>${escapeHtml(conf.conference_title)}</h2>
  </div>
  <p class="section-title">Participants</p>
  ${participantList}
  <div class="page-break"></div>
  ${participantBlocks}
  <div class="footer">${escapeHtml(COPYRIGHT)}</div>
</body>
</html>`;
};

const ensureUploadDir = () => {
  const dir = path.join(__dirname, '..', uploadDir, 'conference-reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const htmlToPlainBlocks = (html) => {
  if (!html) return ['Not documented'];
  const text = String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
};

const drawHeader = (doc) => {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.fillColor('#1E3A5F').fontSize(22).font('Helvetica-Bold')
    .text(DOCUMENT_TITLE, left, doc.y, { width, align: 'center' });
  doc.moveDown(0.25);
  doc.fillColor('#0D9488').fontSize(12).font('Helvetica-Bold')
    .text(DOCUMENT_SUBTITLE, left, doc.y, { width, align: 'center' });
  doc.moveDown(0.55);
  doc.strokeColor('#1E3A5F').lineWidth(2.5)
    .moveTo(left, doc.y).lineTo(left + width, doc.y).stroke();
  doc.moveDown(0.9);
};

const drawConferenceInformation = (doc, conf) => {
  const fields = buildConferenceFields(conf);
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const gap = 18;
  const colWidth = (width - gap) / 2;
  const rowHeight = 32;
  const rows = Math.ceil(fields.length / 2);
  const headingY = doc.y;

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E3A5F')
    .text('CONFERENCE INFORMATION', left, headingY, { width, characterSpacing: 0.8 });

  const boxY = headingY + 16;
  const boxHeight = 18 + (rows * rowHeight) + 10;

  doc.save();
  doc.roundedRect(left, boxY, width, boxHeight, 6)
    .fillAndStroke('#F8FAFC', '#E2E8F0');
  doc.restore();

  fields.forEach((field, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = left + 14 + (col * (colWidth + gap));
    const y = boxY + 12 + (row * rowHeight);
    doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold')
      .text(field[0].toUpperCase(), x, y, { width: colWidth - 16 });
    doc.fillColor('#0F172A').fontSize(10).font('Helvetica')
      .text(field[1], x, y + 12, { width: colWidth - 16 });
  });

  doc.y = boxY + boxHeight + 18;
};

const drawConferenceTitle = (doc, title) => {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.fillColor('#1E3A5F').fontSize(9).font('Helvetica-Bold')
    .text('CONFERENCE TITLE', left, doc.y, { width, characterSpacing: 0.8 });
  doc.moveDown(0.35);
  doc.fillColor('#1E3A5F').fontSize(14).font('Helvetica-Bold')
    .text(dash(title), left, doc.y, { width });
  doc.moveDown(1);
};

const contentBottom = (doc) => doc.page.height - doc.page.margins.bottom;

const ensureSpace = (doc, needed) => {
  if (doc.y + needed > contentBottom(doc)) doc.addPage();
};

const drawFilledBar = (doc, text, { bg, fg, height = 24, fontSize = 11 }) => {
  ensureSpace(doc, height + 10);
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;
  doc.save();
  doc.rect(left, y, width, height).fill(bg);
  doc.restore();
  doc.fillColor(fg).font('Helvetica-Bold').fontSize(fontSize)
    .text(text, left + 10, y + Math.max(4, (height - fontSize) / 2 - 1), {
      width: width - 20,
      lineBreak: false,
    });
  doc.y = y + height + 8;
};

const drawParticipants = (doc, participants) => {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.fillColor('#1E3A5F').fontSize(9).font('Helvetica-Bold')
    .text('PARTICIPANTS', left, doc.y, { width, characterSpacing: 0.8 });
  doc.moveDown(0.45);

  participants.forEach((p) => {
    const style = roleStyle(p.role);
    const extra = p.detail ? ` · ${p.detail}` : '';
    drawFilledBar(doc, `${style.label}  ·  ${p.display_name}${extra}`, {
      bg: style.bg,
      fg: style.fg,
      height: 26,
      fontSize: 11,
    });
  });
};

const drawCopyright = (doc) => {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.page.height - 34;
  doc.save();
  doc.strokeColor('#E2E8F0').lineWidth(0.8)
    .moveTo(left, y - 8).lineTo(left + width, y - 8).stroke();
  doc.fillColor('#64748B').font('Helvetica').fontSize(8)
    .text(COPYRIGHT, left, y, { width, align: 'center' });
  doc.restore();
};

const drawReports = (doc, participants) => {
  participants.forEach((p, index) => {
    if (index > 0) doc.moveDown(0.4);
    const style = roleStyle(p.role);
    const report = p.report;
    drawFilledBar(doc, `${style.label}  ·  ${report.display_name || p.display_name}`, {
      bg: style.bg,
      fg: style.fg,
      height: 28,
      fontSize: 12,
    });

    roleSections(p.role).forEach((title) => {
      drawFilledBar(doc, title, {
        bg: HEADING_BG,
        fg: HEADING_FG,
        height: 22,
        fontSize: 10,
      });
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica');
      htmlToPlainBlocks(sectionContent(report, title)).forEach((line) => {
        ensureSpace(doc, 16);
        doc.text(`• ${line}`, { indent: 12 });
      });
      doc.moveDown(0.45);
    });
  });
};

const listOrderedParticipants = async (conferenceId) => {
  const [confRows] = await pool.execute(
    'SELECT appointment_id FROM conferences WHERE id = ?',
    [conferenceId]
  );
  const appointmentId = confRows[0]?.appointment_id || null;

  let gps = [];
  if (appointmentId) {
    const [rows] = await pool.execute(
      `SELECT gp.user_id,
              NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), '') AS display_name
       FROM appointment_gps ag
       JOIN gps gp ON gp.id = ag.gp_id
       LEFT JOIN user_profiles p ON p.user_id = gp.user_id
       WHERE ag.appointment_id = ?
       ORDER BY ag.id`,
      [appointmentId]
    );
    gps = rows;
  }
  if (!gps.length) {
    const [rows] = await pool.execute(
      `SELECT cp.user_id,
              NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), '') AS display_name
       FROM conference_participants cp
       LEFT JOIN user_profiles p ON p.user_id = cp.user_id
       WHERE cp.conference_id = ? AND cp.role_in_conference = 'gp'
       ORDER BY cp.id`,
      [conferenceId]
    );
    gps = rows;
  }

  let ahps = [];
  if (appointmentId) {
    const [rows] = await pool.execute(
      `SELECT ahp.user_id, aa.profession,
              NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), '') AS display_name
       FROM appointment_ahps aa
       JOIN allied_health_professionals ahp ON ahp.id = aa.ahp_id
       LEFT JOIN user_profiles p ON p.user_id = ahp.user_id
       WHERE aa.appointment_id = ?
       ORDER BY aa.id`,
      [appointmentId]
    );
    ahps = rows;
  }
  if (!ahps.length) {
    const [rows] = await pool.execute(
      `SELECT cp.user_id, NULL AS profession,
              NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), '') AS display_name
       FROM conference_participants cp
       LEFT JOIN user_profiles p ON p.user_id = cp.user_id
       WHERE cp.conference_id = ? AND cp.role_in_conference = 'ahp'
       ORDER BY cp.id`,
      [conferenceId]
    );
    ahps = rows;
  }

  const [guests] = await pool.execute(
    `SELECT user_id, guest_name, guest_role
     FROM conference_guest_access
     WHERE conference_id = ? AND revoked_at IS NULL
     ORDER BY id`,
    [conferenceId]
  );

  const reports = await listReports(conferenceId);
  const byUser = new Map(reports.map((row) => [String(row.user_id), row]));

  const attach = (row, role, detail) => {
    const fallback = {
      display_name: row.display_name || row.guest_name || roleStyle(role).label,
      participant_role: role,
      assessment: null,
      recommendations: null,
      conclusion: null,
    };
    return {
      user_id: row.user_id,
      role,
      display_name: fallback.display_name,
      detail: detail || null,
      report: byUser.get(String(row.user_id)) || fallback,
    };
  };

  return [
    ...gps.map((row) => attach(row, 'gp')),
    ...ahps.map((row) => attach(row, 'ahp', row.profession || null)),
    ...guests.map((row) => attach(row, row.guest_role)),
  ];
};

const buildPdfBuffer = (conf, participants) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 56, left: 50, right: 50 },
  });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  drawHeader(doc);
  drawConferenceInformation(doc, conf);
  drawConferenceTitle(doc, conf.conference_title);
  drawParticipants(doc, participants);

  doc.addPage();
  drawReports(doc, participants);
  drawCopyright(doc);

  doc.end();
});

const formatDocumentCode = (id) => formatSequenceCode('DOC', Number(id));

const hasGeneratedDocuments = async (conferenceId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM conference_generated_documents WHERE conference_id = ? LIMIT 1',
    [conferenceId]
  );
  return rows.length > 0;
};

const generateParticipantDocuments = async (conferenceId, { skipIfExists = false } = {}) => {
  if (skipIfExists && await hasGeneratedDocuments(conferenceId)) return [];

  const [confRows] = await pool.execute(
    `SELECT c.conference_code,
            DATE_FORMAT(c.scheduled_date, '%d %b %Y') AS meeting_date,
            TIME_FORMAT(c.scheduled_time, '%h:%i %p') AS meeting_time,
            TIME_FORMAT(c.accepted_at, '%h:%i %p') AS started_time,
            TIME_FORMAT(c.ended_at, '%h:%i %p') AS ended_time,
            TIMESTAMPDIFF(SECOND, c.accepted_at, c.ended_at) AS duration_seconds,
            CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
            pat.patient_code,
            pat.nic AS medical_id,
            pat.gender,
            TIMESTAMPDIFF(YEAR, pat.dob, COALESCE(c.scheduled_date, CURDATE())) AS age,
            ap.title AS conference_title,
            COALESCE(
              NULLIF(TRIM(CONCAT(COALESCE(cb_p.first_name, ''), ' ', COALESCE(cb_p.last_name, ''))), ''),
              cb.username
            ) AS assigned_by_name
     FROM conferences c
     JOIN patients pat ON pat.id = c.patient_id
     LEFT JOIN appointments ap ON ap.id = c.appointment_id
     LEFT JOIN users cb ON cb.id = c.created_by
     LEFT JOIN user_profiles cb_p ON cb_p.user_id = cb.id
     WHERE c.id = ?`,
    [conferenceId]
  );
  if (!confRows.length) throw new Error('Conference not found');
  const conf = confRows[0];

  const participants = await listOrderedParticipants(conferenceId);
  const uploadBase = ensureUploadDir();

  const [ownerRows] = await pool.execute(
    `SELECT gp.user_id
     FROM conferences c
     JOIN gps gp ON gp.id = c.gp_id
     WHERE c.id = ?`,
    [conferenceId]
  );
  const ownerUserId = participants[0]?.user_id || ownerRows[0]?.user_id;
  if (!ownerUserId) throw new Error('No participant available for the conference document');

  const pdfBuffer = await buildPdfBuffer(conf, participants);

  const storedName = `${conf.conference_code}-${Date.now()}.pdf`;
  const filePath = path.join(uploadBase, storedName);
  fs.writeFileSync(filePath, pdfBuffer);
  const relativePath = path.join(uploadDir, 'conference-reports', storedName);

  const [insertResult] = await pool.execute(
    `INSERT INTO conference_generated_documents
     (conference_id, participant_user_id, participant_name, file_type, original_name, stored_name, file_path, file_size)
     VALUES (?, ?, ?, 'pdf', ?, ?, ?, ?)`,
    [
      conferenceId,
      ownerUserId,
      'Clinical Report',
      'document.pdf',
      storedName,
      relativePath,
      pdfBuffer.length,
    ]
  );

  const documentCode = formatDocumentCode(insertResult.insertId);
  await pool.execute(
    'UPDATE conference_generated_documents SET original_name = ? WHERE id = ?',
    [`${documentCode}.pdf`, insertResult.insertId]
  );

  return [{ type: 'pdf', documentCode, path: relativePath }];
};

module.exports = { buildReportHtml, generateParticipantDocuments, hasGeneratedDocuments, formatDocumentCode };
