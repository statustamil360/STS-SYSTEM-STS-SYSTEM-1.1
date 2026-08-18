const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const HTMLtoDOCX = require('html-to-docx');
const pool = require('../config/db');
const { listReports } = require('./clinicalReportService');
const { uploadDir } = require('../config/jwt');

const stripEmpty = (html) => (html && html !== '<p></p>' ? html : '');

const buildReportHtml = ({
  hospitalName,
  patientName,
  patientCode,
  conferenceCode,
  meetingDate,
  reports,
}) => {
  const participantBlocks = reports.map((r) => `
    <section style="margin-bottom:28px; page-break-inside:avoid;">
      <h2 style="color:#1E3A5F; border-bottom:2px solid #0D9488; padding-bottom:6px; font-size:16px;">
        ${r.display_name} (${String(r.participant_role).replace(/_/g, ' ').toUpperCase()})
      </h2>
      ${['gp', 'guest_gp'].includes(r.participant_role) ? `
        <h3 style="color:#334155; font-size:14px; margin-top:16px;">Assessment</h3>
        <div class="rich">${stripEmpty(r.assessment) || '<p><em>Not documented</em></p>'}</div>
      ` : ''}
      <h3 style="color:#334155; font-size:14px; margin-top:16px;">Recommendations</h3>
      <div class="rich">${stripEmpty(r.recommendations) || '<p><em>Not documented</em></p>'}</div>
      ${['gp', 'guest_gp'].includes(r.participant_role) ? `
        <h3 style="color:#334155; font-size:14px; margin-top:16px;">Conclusion (Outcomes to be achieved)</h3>
        <div class="rich">${stripEmpty(r.conclusion) || '<p><em>Not documented</em></p>'}</div>
      ` : ''}
    </section>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Calibri, Arial, sans-serif; color:#0F172A; margin:40px; font-size:12pt; line-height:1.55; }
    .header { text-align:center; border-bottom:3px solid #1E3A5F; padding-bottom:16px; margin-bottom:24px; }
    .header h1 { color:#1E3A5F; margin:0; font-size:22px; letter-spacing:0.5px; }
    .header p { color:#64748B; margin:6px 0 0; font-size:11pt; }
    .meta { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px; margin-bottom:28px; }
    .meta table { width:100%; border-collapse:collapse; }
    .meta td { padding:4px 8px; font-size:11pt; }
    .meta td.label { color:#64748B; width:140px; font-weight:600; }
    .rich p { margin:0 0 8px; }
    .rich ul, .rich ol { margin:0 0 8px 20px; }
    .rich strong { font-weight:700; }
    .rich em { font-style:italic; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${hospitalName || 'AMC Teleconference'}</h1>
    <p>Multidisciplinary Clinical Conference Report</p>
  </div>
  <div class="meta">
    <table>
      <tr><td class="label">Patient</td><td>${patientName}</td></tr>
      <tr><td class="label">Patient ID</td><td>${patientCode || '—'}</td></tr>
      <tr><td class="label">Conference ID</td><td>${conferenceCode}</td></tr>
      <tr><td class="label">Meeting Date</td><td>${meetingDate}</td></tr>
    </table>
  </div>
  ${participantBlocks}
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

const buildPdfBuffer = ({
  hospitalName,
  patientName,
  patientCode,
  conferenceCode,
  meetingDate,
  reports,
}) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.fillColor('#1E3A5F').fontSize(20).font('Helvetica-Bold').text(hospitalName || 'AMC Teleconference', { align: 'center' });
  doc.moveDown(0.3);
  doc.fillColor('#64748B').fontSize(11).font('Helvetica').text('Multidisciplinary Clinical Conference Report', { align: 'center' });
  doc.moveDown(1);

  doc.fillColor('#0F172A').fontSize(10).font('Helvetica');
  [
    ['Patient', patientName],
    ['Patient ID', patientCode || '—'],
    ['Conference ID', conferenceCode],
    ['Meeting Date', meetingDate],
  ].forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(String(value));
  });

  doc.moveDown(1);

  reports.forEach((r) => {
    doc.fillColor('#1E3A5F').fontSize(13).font('Helvetica-Bold')
      .text(`${r.display_name} (${String(r.participant_role).replace(/_/g, ' ')})`);
    doc.moveDown(0.4);

    const sections = [];
    if (['gp', 'guest_gp'].includes(r.participant_role)) {
      sections.push(['Assessment', r.assessment]);
    }
    sections.push(['Recommendations', r.recommendations]);
    if (['gp', 'guest_gp'].includes(r.participant_role)) {
      sections.push(['Conclusion (Outcomes to be achieved)', r.conclusion]);
    }

    sections.forEach(([title, html]) => {
      doc.fillColor('#334155').fontSize(11).font('Helvetica-Bold').text(title);
      doc.moveDown(0.2);
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica');
      htmlToPlainBlocks(html).forEach((line) => doc.text(`• ${line}`, { indent: 12 }));
      doc.moveDown(0.6);
    });

    doc.moveDown(0.5);
  });

  doc.end();
});

const htmlToDocxBuffer = async (html) => HTMLtoDOCX(html, null, {
  table: { row: { cantSplit: true } },
  footer: true,
  pageNumber: true,
});

const generateParticipantDocuments = async (conferenceId) => {
  const [confRows] = await pool.execute(
    `SELECT c.conference_code,
            DATE_FORMAT(c.scheduled_date, '%d %b %Y') AS meeting_date,
            CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
            pat.patient_code
     FROM conferences c
     JOIN patients pat ON pat.id = c.patient_id
     WHERE c.id = ?`,
    [conferenceId]
  );
  if (!confRows.length) throw new Error('Conference not found');
  const conf = confRows[0];

  const [settings] = await pool.execute(
    "SELECT setting_value FROM settings WHERE setting_key = 'hospital_name'"
  );
  const hospitalName = settings[0]?.setting_value || 'AMC Teleconference';

  const reports = await listReports(conferenceId);
  const uploadBase = ensureUploadDir();
  const saved = [];

  for (const participant of reports) {
    const html = buildReportHtml({
      hospitalName,
      patientName: conf.patient_name,
      patientCode: conf.patient_code,
      conferenceCode: conf.conference_code,
      meetingDate: conf.meeting_date,
      reports,
    });

    const safeName = `${conf.conference_code}-${participant.display_name.replace(/[^a-z0-9]+/gi, '-')}`;
    const pdfBuffer = await buildPdfBuffer({
      hospitalName,
      patientName: conf.patient_name,
      patientCode: conf.patient_code,
      conferenceCode: conf.conference_code,
      meetingDate: conf.meeting_date,
      reports,
    });
    const docxBuffer = await htmlToDocxBuffer(html);

    for (const [ext, buffer] of [['pdf', pdfBuffer], ['docx', docxBuffer]]) {
      const storedName = `${safeName}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadBase, storedName);
      fs.writeFileSync(filePath, buffer);
      const relativePath = path.join(uploadDir, 'conference-reports', storedName);
      const originalName = `${conf.conference_code} - ${participant.display_name}.${ext}`;

      await pool.execute(
        `INSERT INTO conference_generated_documents
         (conference_id, participant_user_id, participant_name, file_type, original_name, stored_name, file_path, file_size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conferenceId,
          participant.user_id,
          participant.display_name,
          ext,
          originalName,
          storedName,
          relativePath,
          buffer.length,
        ]
      );

      saved.push({ participant: participant.display_name, type: ext, path: relativePath });
    }
  }

  return saved;
};

module.exports = { buildReportHtml, generateParticipantDocuments };
