const pool = require('../config/db');

exports.getAhpProfessions = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, created_at FROM ahp_professions WHERE is_active = 1 ORDER BY name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.createAhpProfession = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Profession name is required' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM ahp_professions WHERE LOWER(name) = LOWER(?) AND is_active = 1',
      [name]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'This profession already exists' });
    }

    const [inactive] = await pool.execute(
      'SELECT id FROM ahp_professions WHERE LOWER(name) = LOWER(?) AND is_active = 0',
      [name]
    );
    if (inactive.length) {
      await pool.execute(
        'UPDATE ahp_professions SET is_active = 1, created_by = ? WHERE id = ?',
        [req.user.id, inactive[0].id]
      );
      return res.status(201).json({
        success: true,
        message: 'Profession restored successfully',
        data: { id: inactive[0].id, name },
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO ahp_professions (name, created_by) VALUES (?, ?)',
      [name, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Profession added successfully',
      data: { id: result.insertId, name },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteAhpProfession = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name FROM ahp_professions WHERE id = ? AND is_active = 1',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Profession not found' });
    }

    const [inUse] = await pool.execute(
      'SELECT id FROM allied_health_professionals WHERE profession = ? LIMIT 1',
      [rows[0].name]
    );
    if (inUse.length) {
      return res.status(409).json({
        success: false,
        message: 'Cannot remove a profession that is assigned to an AHP',
      });
    }

    await pool.execute('UPDATE ahp_professions SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Profession removed successfully' });
  } catch (err) {
    next(err);
  }
};
