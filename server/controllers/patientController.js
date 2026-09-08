const pool = require('../config/db');
const { allocatePatientCode } = require('../utils/patientId');
const { notifyRoles } = require('../services/notificationService');
const {
  clinicianScope,
  applyClinicalPatientFilter,
  clinicalSelectExtras,
  canAccessClinicalPatient,
} = require('../utils/clinicalPatientScope');

const denyClinicalAccess = (res) => (
  res.status(403).json({ success: false, message: 'You do not have access to this patient record' })
);

exports.getAll = async (req, res, next) => {
  try {
    const {
      search, status, gender, has_insurance, assigned_gp_id,
      sortBy = 'id', sortOrder = 'desc', page = 1, limit = 10,
    } = req.query;
    const offset = (page - 1) * limit;
    const scope = await clinicianScope(req.user);
    if (scope?.empty) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) },
      });
    }

    const extras = clinicalSelectExtras(scope);
    let query = `SELECT p.*, CONCAT(p.first_name, ' ', p.last_name) AS full_name,
      gp.gp_code, ahp.ahp_code${extras.sql} FROM patients p
      LEFT JOIN gps gp ON p.assigned_gp_id = gp.id
      LEFT JOIN allied_health_professionals ahp ON p.assigned_ahp_id = ahp.id WHERE 1=1`;
    let params = [...extras.params];

    ({ query, params } = applyClinicalPatientFilter(query, params, scope));

    if (search) {
      const tokens = String(search).trim().split(/\s+/).filter(Boolean);
      tokens.forEach((token) => {
        const like = `%${token}%`;
        query += ` AND (
          p.first_name LIKE ? OR p.last_name LIKE ?
          OR CONCAT(p.first_name, ' ', p.last_name) LIKE ?
          OR p.patient_code LIKE ? OR p.nic LIKE ?
          OR p.phone LIKE ? OR p.land_phone LIKE ? OR p.email LIKE ?
        )`;
        params.push(like, like, like, like, like, like, like, like);
      });
    }
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    if (gender) { query += ' AND p.gender = ?'; params.push(gender); }
    if (assigned_gp_id === 'unassigned') {
      query += ' AND p.assigned_gp_id IS NULL';
    } else if (assigned_gp_id) {
      query += ' AND p.assigned_gp_id = ?';
      params.push(assigned_gp_id);
    }
    if (has_insurance === 'yes') { query += " AND p.insurance IS NOT NULL AND p.insurance != ''"; }
    if (has_insurance === 'no') { query += " AND (p.insurance IS NULL OR p.insurance = '')"; }

    const sortColumns = {
      patient_code: 'p.patient_code',
      full_name: 'full_name',
      nic: 'p.nic',
      phone: 'p.phone',
      gender: 'p.gender',
      dob: 'p.dob',
      id: 'p.id',
      created_at: 'p.created_at',
    };
    const orderColumn = sortColumns[sortBy] || 'p.id';
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = query.replace(/SELECT p\.\*[\s\S]*?FROM patients p/, 'SELECT COUNT(*) as total FROM patients p');
    const [countResult] = await pool.execute(countQuery, params.slice(extras.params.length));
    query += ` ORDER BY ${orderColumn} ${orderDirection} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);

    res.json({ success: true, data: rows, pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) } });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    if (!(await canAccessClinicalPatient(req.user, req.params.id))) {
      return denyClinicalAccess(res);
    }
    const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const {
      first_name, last_name, dob, gender, nic, phone, land_phone, email, address, address_2,
      medical_history, emergency_contact, insurance, assigned_gp_id, assigned_ahp_id,
    } = req.body;
    const patientCode = await allocatePatientCode(pool);
    const n = (v) => (v === undefined || v === '' ? null : v);

    const [result] = await pool.execute(
      `INSERT INTO patients (patient_code, first_name, last_name, dob, gender, nic, phone, land_phone, email, address, address_2,
       medical_history, emergency_contact, insurance, assigned_gp_id, assigned_ahp_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientCode, first_name, last_name, n(dob), n(gender), n(nic), n(phone), n(land_phone), n(email), n(address), n(address_2),
        n(medical_history), n(emergency_contact), n(insurance), assigned_gp_id || null, assigned_ahp_id || null, req.user.id]
    );

    await notifyRoles(['admin', 'receptionist'], {
      title: 'New Patient',
      message: `Patient ${first_name} ${last_name} registered`,
      type: 'patient',
    });

    res.status(201).json({ success: true, message: 'Patient created', data: { id: result.insertId, patient_code: patientCode } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const fields = ['first_name', 'last_name', 'dob', 'gender', 'nic', 'phone', 'land_phone', 'email', 'address', 'address_2',
      'medical_history', 'emergency_contact', 'insurance', 'status', 'assigned_gp_id', 'assigned_ahp_id'];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update' });
    values.push(req.params.id);
    await pool.execute(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Patient updated' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Patient deleted' });
  } catch (err) { next(err); }
};

exports.getNotes = async (req, res, next) => {
  try {
    if (!(await canAccessClinicalPatient(req.user, req.params.id))) {
      return denyClinicalAccess(res);
    }
    const [rows] = await pool.execute(
      `SELECT pn.*, CONCAT(p.first_name, ' ', p.last_name) AS gp_name
       FROM patient_notes pn LEFT JOIN gps g ON pn.gp_id = g.id
       LEFT JOIN user_profiles p ON g.user_id = p.user_id
       WHERE pn.patient_id = ? ORDER BY pn.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.addNote = async (req, res, next) => {
  try {
    if (!(await canAccessClinicalPatient(req.user, req.params.id))) {
      return denyClinicalAccess(res);
    }
    const [gpRows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [req.user.id]);
    await pool.execute(
      'INSERT INTO patient_notes (patient_id, gp_id, note) VALUES (?, ?, ?)',
      [req.params.id, gpRows[0]?.id, req.body.note]
    );
    res.status(201).json({ success: true, message: 'Note added' });
  } catch (err) { next(err); }
};

exports.getReports = async (req, res, next) => {
  try {
    if (!(await canAccessClinicalPatient(req.user, req.params.id))) {
      return denyClinicalAccess(res);
    }
    const [rows] = await pool.execute(
      `SELECT pr.*, CONCAT(p.first_name, ' ', p.last_name) AS ahp_name
       FROM patient_reports pr LEFT JOIN allied_health_professionals a ON pr.ahp_id = a.id
       LEFT JOIN user_profiles p ON a.user_id = p.user_id
       WHERE pr.patient_id = ? ORDER BY pr.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.addReport = async (req, res, next) => {
  try {
    if (!(await canAccessClinicalPatient(req.user, req.params.id))) {
      return denyClinicalAccess(res);
    }
    const [ahpRows] = await pool.execute('SELECT id FROM allied_health_professionals WHERE user_id = ?', [req.user.id]);
    await pool.execute(
      'INSERT INTO patient_reports (patient_id, ahp_id, report_content) VALUES (?, ?, ?)',
      [req.params.id, ahpRows[0]?.id, req.body.report_content]
    );
    res.status(201).json({ success: true, message: 'Report added' });
  } catch (err) { next(err); }
};
