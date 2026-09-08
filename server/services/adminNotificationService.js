const pool = require('../config/db');
const { buildExport } = require('./exportService');
const { sendMail } = require('./emailService');
const {
  getBooleanSetting,
  getStringSetting,
  clearSettingsCache,
} = require('./settingsService');

const APPOINTMENT_COLUMNS = [
  { key: 'appointment_code', header: 'Appointment ID', width: 16 },
  { key: 'patient_name', header: 'Patient', width: 22 },
  { key: 'appointment_date', header: 'Date', width: 14 },
  { key: 'appointment_time', header: 'Time', width: 12 },
  { key: 'gp_summary', header: 'GPs', width: 22 },
  { key: 'ahp_summary', header: 'AHPs', width: 22 },
  { key: 'status', header: 'Status', width: 12 },
  { key: 'cancelled_reason', header: 'Cancel reason', width: 22 },
  { key: 'assigned_by_name', header: 'Assigned by', width: 18 },
  { key: 'title', header: 'Title', width: 22 },
];

const CONFERENCE_HISTORY_COLUMNS = [
  { key: 'conference_code', header: 'Conference ID', width: 16 },
  { key: 'patient_name', header: 'Patient', width: 22 },
  { key: 'assigned_by_name', header: 'Assigned by', width: 18 },
  { key: 'scheduled_date', header: 'Date', width: 14 },
  { key: 'started_time', header: 'Start time', width: 12 },
  { key: 'ended_time', header: 'End time', width: 12 },
  { key: 'status', header: 'Status', width: 12 },
  { key: 'cancelled_reason', header: 'Cancel reason', width: 22 },
];

const zonedParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
  }).formatToParts(date);
  const pick = (type) => parts.find((p) => p.type === type)?.value;
  return {
    dateKey: `${pick('year')}-${pick('month')}-${pick('day')}`,
    weekday: pick('weekday'),
    hour: Number(pick('hour')),
    minute: Number(pick('minute')),
    monthKey: `${pick('year')}-${pick('month')}`,
  };
};

const addDays = (isoDate, days) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
};

const weekRange = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDays(isoDate, mondayOffset);
  return { start, end: addDays(start, 6) };
};

const monthRange = (isoDate) => {
  const [y, m] = isoDate.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start, end: `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}` };
};

const formatClock = (value) => {
  if (!value) return '—';
  const text = String(value);
  if (/\b(AM|PM)\b/i.test(text)) return text;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hours = value.getUTCHours();
    const minutes = String(value.getUTCMinutes()).padStart(2, '0');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(hour12).padStart(2, '0')}:${minutes} ${suffix}`;
  }
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, '0')}:${match[2]} ${suffix}`;
};

const toDateKey = (value) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
};

const display = (value) => {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
};

const getTimezone = async () => (await getStringSetting('timezone', 'Asia/Colombo')) || 'Asia/Colombo';

const getNotificationConfig = async () => {
  const [
    email,
    hospitalName,
    timezone,
    assigned,
    cancelled,
    weekly,
    monthly,
    historyMonthly,
  ] = await Promise.all([
    getStringSetting('notification_email', ''),
    getStringSetting('hospital_name', 'STS Hospital'),
    getTimezone(),
    getBooleanSetting('notify_appointment_assigned', true),
    getBooleanSetting('notify_appointment_cancelled', true),
    getBooleanSetting('notify_appointment_weekly', true),
    getBooleanSetting('notify_appointment_monthly', true),
    getBooleanSetting('notify_conference_history_monthly', true),
  ]);
  return {
    email: String(email || '').trim(),
    hospitalName: hospitalName || 'STS Hospital',
    timezone,
    assigned,
    cancelled,
    weekly,
    monthly,
    historyMonthly,
  };
};

const appointmentSelectSql = `
  SELECT a.id, a.appointment_code, a.title, a.status, a.cancelled_reason,
         a.important_note,
         DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
         TIME_FORMAT(a.appointment_time, '%H:%i:%s') AS appointment_time,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         COALESCE(
           NULLIF(TRIM(CONCAT(COALESCE(cb_p.first_name, ''), ' ', COALESCE(cb_p.last_name, ''))), ''),
           cb.username
         ) AS assigned_by_name,
         (
           SELECT GROUP_CONCAT(
             TRIM(CONCAT(COALESCE(gp_p.first_name, ''), ' ', COALESCE(gp_p.last_name, '')))
             ORDER BY ag.id SEPARATOR '; '
           )
           FROM appointment_gps ag
           JOIN gps g ON ag.gp_id = g.id
           LEFT JOIN user_profiles gp_p ON gp_p.user_id = g.user_id
           WHERE ag.appointment_id = a.id
         ) AS gp_summary,
         (
           SELECT GROUP_CONCAT(
             CONCAT(aa.profession, ': ', TRIM(CONCAT(COALESCE(ahp_p.first_name, ''), ' ', COALESCE(ahp_p.last_name, ''))))
             ORDER BY aa.id SEPARATOR '; '
           )
           FROM appointment_ahps aa
           JOIN allied_health_professionals ah ON aa.ahp_id = ah.id
           LEFT JOIN user_profiles ahp_p ON ahp_p.user_id = ah.user_id
           WHERE aa.appointment_id = a.id
         ) AS ahp_summary
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  LEFT JOIN users cb ON cb.id = a.created_by
  LEFT JOIN user_profiles cb_p ON cb_p.user_id = cb.id
`;

const mapAppointmentRow = (row) => ({
  ...row,
  appointment_date: toDateKey(row.appointment_date) || display(row.appointment_date),
  appointment_time: formatClock(row.appointment_time),
  status: String(row.status || '').replace(/_/g, ' '),
  gp_summary: row.gp_summary || '—',
  ahp_summary: row.ahp_summary || '—',
  cancelled_reason: row.cancelled_reason || '—',
  assigned_by_name: row.assigned_by_name || '—',
  title: row.title || '—',
});

const fetchAppointmentsBetween = async (startDate, endDate) => {
  const [rows] = await pool.execute(
    `${appointmentSelectSql} WHERE a.appointment_date BETWEEN ? AND ?
     ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
    [startDate, endDate]
  );
  return rows.map(mapAppointmentRow);
};

const fetchConferenceHistoryBetween = async (startDate, endDate) => {
  const [rows] = await pool.execute(
    `SELECT c.conference_code,
            DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
            TIME_FORMAT(c.accepted_at, '%H:%i:%s') AS started_time,
            TIME_FORMAT(c.ended_at, '%H:%i:%s') AS ended_time,
            c.status, c.cancelled_reason,
            CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
            COALESCE(
              NULLIF(TRIM(CONCAT(COALESCE(cb_p.first_name, ''), ' ', COALESCE(cb_p.last_name, ''))), ''),
              cb.username
            ) AS assigned_by_name
     FROM conferences c
     JOIN patients pat ON c.patient_id = pat.id
     LEFT JOIN users cb ON cb.id = c.created_by
     LEFT JOIN user_profiles cb_p ON cb_p.user_id = cb.id
     WHERE c.status IN ('completed', 'cancelled')
       AND c.scheduled_date BETWEEN ? AND ?
     ORDER BY c.scheduled_date ASC, c.scheduled_time ASC`,
    [startDate, endDate]
  );
  return rows.map((row) => ({
    ...row,
    started_time: formatClock(row.started_time),
    ended_time: formatClock(row.ended_time),
    status: String(row.status || '').replace(/_/g, ' '),
    cancelled_reason: row.cancelled_reason || '—',
    assigned_by_name: row.assigned_by_name || '—',
  }));
};

const appointmentLines = (appointment, timezone) => ([
  `Appointment ID: ${display(appointment.appointment_code)}`,
  `Patient: ${display(appointment.patient_name)}`,
  `Date: ${display(toDateKey(appointment.appointment_date) || appointment.appointment_date)}`,
  `Time: ${formatClock(appointment.appointment_time)}`,
  `Title: ${display(appointment.title)}`,
  `Status: ${display(String(appointment.status || '').replace(/_/g, ' '))}`,
  `GPs: ${display(appointment.gp_summary || appointment.gp_name)}`,
  `AHPs: ${display(appointment.ahp_summary)}`,
  `Assigned by: ${display(appointment.assigned_by_name)}`,
  appointment.cancelled_reason
    ? `Cancel reason: ${appointment.cancelled_reason}`
    : null,
  appointment.important_note ? `Conference notes: ${appointment.important_note}` : null,
  `Timezone: ${timezone}`,
].filter(Boolean));

const sendDetailEmail = async ({ config, subject, heading, lines }) => {
  const text = [heading, ...lines].join('\n');
  return sendMail({
    to: config.email,
    subject,
    text,
    html: `<div style="font-family:Segoe UI,sans-serif;line-height:1.55">
      <h2 style="color:#0F766E;margin:0 0 12px">${heading}</h2>
      ${lines.map((line) => `<div>${line}</div>`).join('')}
    </div>`,
  });
};

const sendPdfEmail = async ({
  config, columns, rows, title, subtitle, fileName, subject,
}) => {
  const exportFile = await buildExport('pdf', {
    columns, rows, title, subtitle, fileName,
  });
  const text = [
    title,
    subtitle,
    `${rows.length} record${rows.length === 1 ? '' : 's'}.`,
    'The PDF is attached.',
  ].join('\n');
  return sendMail({
    to: config.email,
    subject,
    text,
    html: `<p style="font-family:Segoe UI,sans-serif;line-height:1.5">${text.replace(/\n/g, '<br/>')}</p>`,
    attachments: [{
      filename: exportFile.fileName,
      content: exportFile.buffer,
      contentType: exportFile.mimeType,
    }],
  });
};

const sendPdfBundle = async ({ config, subject, title, subtitle, attachments }) => {
  const built = [];
  for (const item of attachments) {
    const exportFile = await buildExport('pdf', {
      columns: item.columns,
      rows: item.rows,
      title: item.title,
      subtitle,
      fileName: item.fileName,
    });
    built.push({
      filename: exportFile.fileName,
      content: exportFile.buffer,
      contentType: exportFile.mimeType,
      count: item.rows.length,
      label: item.title,
    });
  }
  const text = [
    title,
    subtitle,
    ...built.map((file) => `${file.label}: ${file.count} record${file.count === 1 ? '' : 's'}`),
    'PDF files are attached.',
  ].join('\n');
  return sendMail({
    to: config.email,
    subject,
    text,
    html: `<p style="font-family:Segoe UI,sans-serif;line-height:1.5">${text.replace(/\n/g, '<br/>')}</p>`,
    attachments: built.map(({ filename, content, contentType }) => ({ filename, content, contentType })),
  });
};

const notifyAppointmentCreated = async (appointment) => {
  try {
    if (!appointment) return;
    const config = await getNotificationConfig();
    if (!config.email || !config.assigned) return;
    await sendDetailEmail({
      config,
      subject: `${config.hospitalName}: New appointment ${appointment.appointment_code || ''} assigned`,
      heading: `${config.hospitalName} — New appointment assigned`,
      lines: appointmentLines(appointment, config.timezone),
    });
  } catch (err) {
    console.error('[notifications] new appointment email failed:', err.message);
  }
};

const notifyAppointmentCancelled = async (appointment) => {
  try {
    if (!appointment) return;
    const config = await getNotificationConfig();
    if (!config.email || !config.cancelled) return;
    await sendDetailEmail({
      config,
      subject: `${config.hospitalName}: Appointment ${appointment.appointment_code || ''} cancelled`,
      heading: `${config.hospitalName} — Appointment cancelled`,
      lines: appointmentLines({
        ...appointment,
        cancelled_reason: appointment.cancelled_reason || 'Not specified',
      }, config.timezone),
    });
  } catch (err) {
    console.error('[notifications] cancelled appointment email failed:', err.message);
  }
};

const notifyAppointmentsCancelledByIds = async (ids) => {
  if (!ids?.length) return;
  const [rows] = await pool.execute(
    `${appointmentSelectSql} WHERE a.id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  await Promise.allSettled(rows.map((row) => notifyAppointmentCancelled(mapAppointmentRow(row))));
};

const notifyConferenceCancelled = async (conference) => {
  if (!conference) return;
  return notifyAppointmentCancelled({
    appointment_code: conference.appointment_code || conference.conference_code,
    patient_name: conference.patient_name,
    appointment_date: conference.appointment_date || conference.scheduled_date,
    appointment_time: conference.appointment_time || conference.scheduled_time,
    title: conference.title,
    status: 'cancelled',
    gp_summary: conference.gp_summary || conference.gp_participants || conference.gp_name,
    ahp_summary: conference.ahp_summary || conference.ahp_participants || conference.ahp_name,
    assigned_by_name: conference.assigned_by_name,
    cancelled_reason: conference.cancelled_reason,
  });
};

const markSent = async (key, value) => {
  await pool.execute(
    `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, value]
  );
  clearSettingsCache();
};

const isSunday = (weekday) => weekday === 'Sun' || weekday === 'Sunday';

const tickScheduledDigests = async () => {
  try {
    const config = await getNotificationConfig();
    if (!config.email) return;
    const now = zonedParts(new Date(), config.timezone);
    if (now.hour < 18) return;

    const jobs = [];
    if (config.weekly && isSunday(now.weekday)) {
      const last = await getStringSetting('digest_last_weekly', '');
      if (last !== now.dateKey) {
        const week = weekRange(now.dateKey);
        jobs.push((async () => {
          const rows = await fetchAppointmentsBetween(week.start, week.end);
          const result = await sendPdfEmail({
            config,
            columns: APPOINTMENT_COLUMNS,
            rows,
            title: `${config.hospitalName} — This week's appointments`,
            subtitle: `Week ending ${week.end} · ${week.start} to ${week.end} · ${config.timezone}`,
            fileName: `appointments-week-${week.start}-to-${week.end}`,
            subject: `${config.hospitalName}: This week's appointments (${week.start} to ${week.end})`,
          });
          if (result.sent) await markSent('digest_last_weekly', now.dateKey);
        })());
      }
    }

    const month = monthRange(now.dateKey);
    const isMonthEnd = now.dateKey === month.end;
    if (isMonthEnd && (config.monthly || config.historyMonthly)) {
      const last = await getStringSetting('digest_last_monthly', '');
      if (last !== now.monthKey) {
        jobs.push((async () => {
          const attachments = [];
          if (config.monthly) {
            attachments.push({
              columns: APPOINTMENT_COLUMNS,
              rows: await fetchAppointmentsBetween(month.start, month.end),
              title: `${config.hospitalName} — This month's appointments`,
              fileName: `appointments-month-${now.monthKey}`,
            });
          }
          if (config.historyMonthly) {
            attachments.push({
              columns: CONFERENCE_HISTORY_COLUMNS,
              rows: await fetchConferenceHistoryBetween(month.start, month.end),
              title: `${config.hospitalName} — Conference history`,
              fileName: `conference-history-${now.monthKey}`,
            });
          }
          if (!attachments.length) return;
          const result = await sendPdfBundle({
            config,
            title: `${config.hospitalName} — Monthly reports`,
            subtitle: `${month.start} to ${month.end} · ${config.timezone}`,
            subject: `${config.hospitalName}: Monthly appointment and conference history PDFs (${now.monthKey})`,
            attachments,
          });
          if (result.sent) await markSent('digest_last_monthly', now.monthKey);
        })());
      }
    }

    await Promise.allSettled(jobs);
  } catch (err) {
    console.error('[notifications] scheduled digest failed:', err.message);
  }
};

const startNotificationScheduler = () => {
  console.log('[notifications] scheduler started (week-end and month-end PDFs at 18:00 system timezone)');
  tickScheduledDigests();
  setInterval(tickScheduledDigests, 60 * 1000);
};

module.exports = {
  notifyAppointmentCreated,
  notifyAppointmentCancelled,
  notifyAppointmentsCancelledByIds,
  notifyConferenceCancelled,
  startNotificationScheduler,
};
