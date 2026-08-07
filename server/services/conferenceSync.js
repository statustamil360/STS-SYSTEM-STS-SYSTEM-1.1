const { ensureConferenceSequence, allocateConferenceCode } = require('../utils/conferenceId');

const notifyUser = async (conn, userId, title, message) => {
  await conn.execute(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
    [userId, title, message, 'conference']
  );
};

const syncParticipants = async (conn, conferenceId, gpId, ahpIds, isNew) => {
  await conn.execute('DELETE FROM conference_participants WHERE conference_id = ?', [conferenceId]);

  const participants = [];

  if (gpId) {
    const [gpUser] = await conn.execute('SELECT user_id FROM gps WHERE id = ?', [gpId]);
    if (gpUser.length) {
      participants.push({ userId: gpUser[0].user_id, role: 'gp' });
    }
  }

  for (const ahpId of ahpIds) {
    const [ahpUser] = await conn.execute(
      'SELECT user_id FROM allied_health_professionals WHERE id = ?',
      [ahpId]
    );
    if (ahpUser.length) {
      participants.push({ userId: ahpUser[0].user_id, role: 'ahp' });
    }
  }

  for (const p of participants) {
    await conn.execute(
      'INSERT INTO conference_participants (conference_id, user_id, role_in_conference) VALUES (?, ?, ?)',
      [conferenceId, p.userId, p.role]
    );
    if (isNew) {
      await notifyUser(
        conn,
        p.userId,
        'Conference Scheduled',
        'You have been assigned to a teleconference meeting'
      );
    }
  }

  return participants;
};

exports.syncConferenceFromAppointment = async (conn, appointmentId, createdByUserId) => {
  const [appointments] = await conn.execute(
    `SELECT a.*, aa.ahp_id AS linked_ahp_id
     FROM appointments a
     LEFT JOIN appointment_ahps aa ON aa.appointment_id = a.id
     WHERE a.id = ?`,
    [appointmentId]
  );

  if (!appointments.length) return null;

  const appointment = appointments[0];
  const ahpIds = [...new Set(
    appointments.map((row) => row.linked_ahp_id).filter(Boolean)
  )];
  const firstAhpId = ahpIds[0] || appointment.ahp_id || null;
  const notes = [
    appointment.title ? `Title: ${appointment.title}` : null,
    appointment.important_note ? `Important: ${appointment.important_note}` : null,
    appointment.notes,
  ].filter(Boolean).join('\n') || null;

  const [existing] = await conn.execute(
    'SELECT id, conference_code, status FROM conferences WHERE appointment_id = ?',
    [appointmentId]
  );

  if (existing.length) {
    const conferenceId = existing[0].id;
    const preserveStatus = ['live', 'completed'].includes(existing[0].status)
      ? existing[0].status
      : (appointment.status === 'cancelled' ? 'cancelled' : 'scheduled');

    await conn.execute(
      `UPDATE conferences SET
        patient_id = ?, gp_id = ?, ahp_id = ?,
        scheduled_date = ?, scheduled_time = ?,
        notes = ?, status = ?
       WHERE id = ?`,
      [
        appointment.patient_id,
        appointment.gp_id,
        firstAhpId,
        appointment.appointment_date,
        appointment.appointment_time,
        notes,
        preserveStatus,
        conferenceId,
      ]
    );

    await syncParticipants(conn, conferenceId, appointment.gp_id, ahpIds, false);
    return conferenceId;
  }

  await ensureConferenceSequence(conn);
  const conferenceCode = await allocateConferenceCode(conn);
  const meetingLink = `https://meet.amc.com/${conferenceCode.toLowerCase()}`;

  const [result] = await conn.execute(
    `INSERT INTO conferences (
      conference_code, appointment_id, patient_id, gp_id, ahp_id,
      scheduled_date, scheduled_time, status, meeting_link, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conferenceCode,
      appointmentId,
      appointment.patient_id,
      appointment.gp_id,
      firstAhpId,
      appointment.appointment_date,
      appointment.appointment_time,
      appointment.status === 'cancelled' ? 'cancelled' : 'scheduled',
      meetingLink,
      notes,
      createdByUserId,
    ]
  );

  await syncParticipants(conn, result.insertId, appointment.gp_id, ahpIds, true);
  return result.insertId;
};

exports.cancelConferenceForAppointment = async (conn, appointmentId, reason = null) => {
  await conn.execute(
    `UPDATE conferences
     SET status = 'cancelled', cancelled_reason = COALESCE(?, cancelled_reason), cancelled_at = NOW()
     WHERE appointment_id = ? AND status NOT IN ('completed', 'cancelled')`,
    [reason, appointmentId]
  );
};
