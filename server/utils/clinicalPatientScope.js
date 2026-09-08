const pool = require('../config/db');

const clinicianScope = async (user) => {
  if (user.role === 'gp') {
    const [rows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [user.id]);
    return rows[0]?.id
      ? { kind: 'gp', staffId: rows[0].id, userId: user.id }
      : { kind: 'gp', staffId: 0, userId: user.id, empty: true };
  }
  if (user.role === 'ahp') {
    const [rows] = await pool.execute(
      'SELECT id FROM allied_health_professionals WHERE user_id = ?',
      [user.id]
    );
    return rows[0]?.id
      ? { kind: 'ahp', staffId: rows[0].id, userId: user.id }
      : { kind: 'ahp', staffId: 0, userId: user.id, empty: true };
  }
  return null;
};

const gpPatientSql = `(
  p.assigned_gp_id = ?
  OR EXISTS (
    SELECT 1 FROM conferences c
    WHERE c.patient_id = p.id
      AND (
        c.gp_id = ?
        OR EXISTS (
          SELECT 1 FROM conference_participants cp
          WHERE cp.conference_id = c.id AND cp.user_id = ?
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = p.id
      AND (
        a.gp_id = ?
        OR EXISTS (
          SELECT 1 FROM appointment_gps ag
          WHERE ag.appointment_id = a.id AND ag.gp_id = ?
        )
      )
  )
)`;

const ahpPatientSql = `(
  p.assigned_ahp_id = ?
  OR EXISTS (
    SELECT 1 FROM conferences c
    WHERE c.patient_id = p.id
      AND (
        c.ahp_id = ?
        OR EXISTS (
          SELECT 1 FROM conference_participants cp
          WHERE cp.conference_id = c.id AND cp.user_id = ?
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = p.id
      AND (
        a.ahp_id = ?
        OR EXISTS (
          SELECT 1 FROM appointment_ahps aa
          WHERE aa.appointment_id = a.id AND aa.ahp_id = ?
        )
      )
  )
)`;

const applyClinicalPatientFilter = (query, params, scope) => {
  if (!scope) return { query, params };
  if (scope.kind === 'gp') {
    query += ` AND ${gpPatientSql}`;
    params.push(scope.staffId, scope.staffId, scope.userId, scope.staffId, scope.staffId);
  } else {
    query += ` AND ${ahpPatientSql}`;
    params.push(scope.staffId, scope.staffId, scope.userId, scope.staffId, scope.staffId);
  }
  return { query, params };
};

const clinicalSelectExtras = (scope) => {
  if (!scope) return { sql: '', params: [] };
  if (scope.kind === 'gp') {
    return {
      sql: `,
        (
          SELECT COUNT(*) FROM conferences c
          WHERE c.patient_id = p.id
            AND (
              c.gp_id = ?
              OR EXISTS (
                SELECT 1 FROM conference_participants cp
                WHERE cp.conference_id = c.id AND cp.user_id = ?
              )
            )
        ) AS conference_count,
        (
          SELECT MAX(c.scheduled_date) FROM conferences c
          WHERE c.patient_id = p.id
            AND (
              c.gp_id = ?
              OR EXISTS (
                SELECT 1 FROM conference_participants cp
                WHERE cp.conference_id = c.id AND cp.user_id = ?
              )
            )
        ) AS last_conference_date`,
      params: [scope.staffId, scope.userId, scope.staffId, scope.userId],
    };
  }
  return {
    sql: `,
      (
        SELECT COUNT(*) FROM conferences c
        WHERE c.patient_id = p.id
          AND (
            c.ahp_id = ?
            OR EXISTS (
              SELECT 1 FROM conference_participants cp
              WHERE cp.conference_id = c.id AND cp.user_id = ?
            )
          )
      ) AS conference_count,
      (
        SELECT MAX(c.scheduled_date) FROM conferences c
        WHERE c.patient_id = p.id
          AND (
            c.ahp_id = ?
            OR EXISTS (
              SELECT 1 FROM conference_participants cp
              WHERE cp.conference_id = c.id AND cp.user_id = ?
            )
          )
      ) AS last_conference_date`,
    params: [scope.staffId, scope.userId, scope.staffId, scope.userId],
  };
};

const canAccessClinicalPatient = async (user, patientId) => {
  const scope = await clinicianScope(user);
  if (!scope) return true;
  if (scope.empty) return false;
  let query = 'SELECT p.id FROM patients p WHERE p.id = ?';
  let params = [patientId];
  ({ query, params } = applyClinicalPatientFilter(query, params, scope));
  const [rows] = await pool.execute(query, params);
  return rows.length > 0;
};

module.exports = {
  clinicianScope,
  applyClinicalPatientFilter,
  clinicalSelectExtras,
  canAccessClinicalPatient,
};
