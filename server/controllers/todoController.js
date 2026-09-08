const pool = require('../config/db');

let todosTableReady = false;

const ensureTodosTable = async () => {
  if (todosTableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_todos (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      is_completed TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  todosTableReady = true;
};

const mapTodo = (row) => ({
  ...row,
  is_completed: Boolean(row.is_completed),
});

exports.getAll = async (req, res, next) => {
  try {
    await ensureTodosTable();
    const [rows] = await pool.execute(
      `SELECT id, user_id, title, is_completed, created_at, updated_at
       FROM user_todos
       WHERE user_id = ?
       ORDER BY is_completed ASC, created_at DESC, id DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows.map(mapTodo) });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    await ensureTodosTable();
    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Please enter a to-do' });
    }
    const [result] = await pool.execute(
      'INSERT INTO user_todos (user_id, title) VALUES (?, ?)',
      [req.user.id, title.slice(0, 255)]
    );
    const [rows] = await pool.execute(
      'SELECT id, user_id, title, is_completed, created_at, updated_at FROM user_todos WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ success: true, message: 'To-do added', data: mapTodo(rows[0]) });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    await ensureTodosTable();
    const [existing] = await pool.execute(
      'SELECT id FROM user_todos WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'To-do not found' });
    }

    const updates = [];
    const values = [];
    if (req.body.title !== undefined) {
      const title = String(req.body.title || '').trim();
      if (!title) {
        return res.status(400).json({ success: false, message: 'Please enter a to-do' });
      }
      updates.push('title = ?');
      values.push(title.slice(0, 255));
    }
    if (req.body.is_completed !== undefined) {
      updates.push('is_completed = ?');
      values.push(req.body.is_completed ? 1 : 0);
    }
    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No changes provided' });
    }

    values.push(req.params.id, req.user.id);
    await pool.execute(
      `UPDATE user_todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    const [rows] = await pool.execute(
      'SELECT id, user_id, title, is_completed, created_at, updated_at FROM user_todos WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, message: 'To-do updated', data: mapTodo(rows[0]) });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await ensureTodosTable();
    const [result] = await pool.execute(
      'DELETE FROM user_todos WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'To-do not found' });
    }
    res.json({ success: true, message: 'To-do removed' });
  } catch (err) { next(err); }
};
