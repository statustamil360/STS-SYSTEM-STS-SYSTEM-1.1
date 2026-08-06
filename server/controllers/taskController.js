const pool = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { search, status, priority, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT t.*, CONCAT(p.first_name, ' ', p.last_name) AS assigned_to_name
      FROM tasks t
      LEFT JOIN user_profiles p ON t.assigned_to = p.user_id WHERE 1=1`;
    const params = [];

    if (['gp', 'ahp'].includes(req.user.role)) {
      query += ' AND t.assigned_to = ?';
      params.push(req.user.id);
    }

    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
    if (search) {
      query += ' AND (t.title LIKE ? OR CONCAT(p.first_name, \' \', p.last_name) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(
      query.replace(/SELECT t\.\*.*FROM tasks t/s, 'SELECT COUNT(*) as total FROM tasks t'),
      params
    );
    query += ' ORDER BY t.due_date ASC, FIELD(t.priority, \'critical\', \'high\', \'medium\', \'low\') LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows, pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, assigned_to, due_date, priority, reminder_at } = req.body;
    const n = (v) => (v === undefined ? null : v);
    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, due_date, priority, reminder_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, n(description), assigned_to, req.user.id, n(due_date), priority || 'medium', reminder_at || null]
    );

    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [assigned_to, 'Task Assigned', `New task: ${title}`, 'task']
    );

    res.status(201).json({ success: true, message: 'Task created', data: { id: result.insertId } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const fields = ['title', 'description', 'assigned_to', 'due_date', 'priority', 'status', 'reminder_at'];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
    });
    values.push(req.params.id);
    await pool.execute(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Task updated' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
};
