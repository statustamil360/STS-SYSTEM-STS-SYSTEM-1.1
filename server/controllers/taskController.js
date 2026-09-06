const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { uploadDir } = require('../config/jwt');

const MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

let filesTableReady = false;
let readColumnsReady = false;
let updatesTableReady = false;

const ensureTaskFilesTable = async () => {
  if (filesTableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS task_files (
      id INT PRIMARY KEY AUTO_INCREMENT,
      task_id INT NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT,
      mime_type VARCHAR(100),
      uploaded_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  filesTableReady = true;
};

const ensureTaskUpdatesTable = async () => {
  if (updatesTableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS task_updates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      task_id INT NOT NULL,
      user_id INT,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  updatesTableReady = true;
};

const listTaskUpdates = async (taskId) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.message, u.created_at,
      COALESCE(
        NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), ''),
        usr.email
      ) AS author_name
     FROM task_updates u
     LEFT JOIN users usr ON u.user_id = usr.id
     LEFT JOIN user_profiles p ON p.user_id = usr.id
     WHERE u.task_id = ?
     ORDER BY u.created_at DESC, u.id DESC`,
    [taskId]
  );
  return rows;
};

const insertTaskUpdate = async (taskId, userId, message) => {
  const text = String(message || '').trim();
  if (!text) return;
  await pool.execute(
    'INSERT INTO task_updates (task_id, user_id, message) VALUES (?, ?, ?)',
    [taskId, userId, text]
  );
};

const ensureTaskReadColumns = async () => {
  if (readColumnsReady) return;
  const [cols] = await pool.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks'
       AND COLUMN_NAME IN ('assignee_read_at', 'assigner_read_at')`
  );
  const names = new Set(cols.map((c) => c.COLUMN_NAME));
  if (!names.has('assignee_read_at')) {
    await pool.execute('ALTER TABLE tasks ADD COLUMN assignee_read_at TIMESTAMP NULL');
  }
  if (!names.has('assigner_read_at')) {
    await pool.execute('ALTER TABLE tasks ADD COLUMN assigner_read_at TIMESTAMP NULL');
    await pool.execute('UPDATE tasks SET assigner_read_at = NOW() WHERE assigner_read_at IS NULL');
  }
  readColumnsReady = true;
};

const notifyAssignerOfAssigneeUpdate = async (task, updaterId, { statusChanged, newStatus, hasTaskUpdate }) => {
  if (!task.assigned_by || Number(task.assigned_by) === Number(updaterId)) return;
  if (!statusChanged && !hasTaskUpdate) return;

  await pool.execute('UPDATE tasks SET assigner_read_at = NULL WHERE id = ?', [task.id]);

  const statusLabel = String(newStatus || task.status || '').replace(/_/g, ' ');
  let title = 'Task Updated';
  let message = `New update on task "${task.title}"`;
  if (statusChanged && hasTaskUpdate) {
    message = `Task "${task.title}" is now ${statusLabel}. A new update was posted.`;
  } else if (statusChanged) {
    title = 'Task Status Updated';
    message = `Task "${task.title}" is now ${statusLabel}`;
  }

  await pool.execute(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
    [task.assigned_by, title, message, 'task']
  );
};

const resolveFilePath = (filePath) => {
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(__dirname, '..', filePath);
};

const resolveMimeType = (file) => {
  if (file.mime_type) return file.mime_type;
  const ext = path.extname(file.original_name || file.stored_name || '').toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
};

const isManager = (role) => ['admin', 'receptionist', 'super_admin'].includes(role);

const canAccessTask = (task, user) => (
  isManager(user.role)
  || Number(task.assigned_to) === Number(user.id)
  || Number(task.assigned_by) === Number(user.id)
);

const canFullyEditTask = (task, user) => (
  isManager(user.role) || Number(task.assigned_by) === Number(user.id)
);

const insertTaskFiles = async (taskId, files, userId) => {
  if (!files?.length) return;
  for (const file of files) {
    await pool.execute(
      `INSERT INTO task_files (task_id, original_name, stored_name, file_path, file_size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        file.originalname,
        file.filename,
        path.join(uploadDir, file.filename).replace(/\\/g, '/'),
        file.size,
        file.mimetype,
        userId,
      ]
    );
  }
};

const listTaskFiles = async (taskId) => {
  const [rows] = await pool.execute(
    'SELECT id, original_name, stored_name, file_path, file_size, mime_type, created_at FROM task_files WHERE task_id = ? ORDER BY id',
    [taskId]
  );
  return rows;
};

const TASK_SELECT = `
  SELECT t.*,
    CONCAT(p.first_name, ' ', p.last_name) AS assigned_to_name,
    COALESCE(
      NULLIF(TRIM(CONCAT(COALESCE(ab_p.first_name, ''), ' ', COALESCE(ab_p.last_name, ''))), ''),
      ab.email
    ) AS assigned_by_name
  FROM tasks t
  LEFT JOIN user_profiles p ON t.assigned_to = p.user_id
  LEFT JOIN users ab ON t.assigned_by = ab.id
  LEFT JOIN user_profiles ab_p ON ab_p.user_id = ab.id
`;

exports.getUnreadCount = async (req, res, next) => {
  try {
    await ensureTaskReadColumns();
    const [rows] = await pool.execute(
      `SELECT
         SUM(CASE WHEN assigned_to = ? AND assigned_by <> ? AND assignee_read_at IS NULL THEN 1 ELSE 0 END) AS inbox_count,
         SUM(CASE WHEN assigned_by = ? AND assigner_read_at IS NULL THEN 1 ELSE 0 END) AS assigned_update_count
       FROM tasks`,
      [req.user.id, req.user.id, req.user.id]
    );
    const inboxCount = Number(rows[0].inbox_count) || 0;
    const assignedUpdateCount = Number(rows[0].assigned_update_count) || 0;
    res.json({
      success: true,
      count: inboxCount,
      inboxCount,
      assignedUpdateCount,
    });
  } catch (err) { next(err); }
};

exports.markAssignerRead = async (req, res, next) => {
  try {
    await ensureTaskReadColumns();
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (!canAccessTask(tasks[0], req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task' });
    }
    const fields = [];
    if (Number(tasks[0].assigned_by) === Number(req.user.id)) {
      fields.push('assigner_read_at = NOW()');
    }
    if (Number(tasks[0].assigned_to) === Number(req.user.id)) {
      fields.push('assignee_read_at = NOW()');
    }
    if (fields.length) {
      await pool.execute(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        [req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.markInboxRead = async (req, res, next) => {
  try {
    await ensureTaskReadColumns();
    await pool.execute(
      'UPDATE tasks SET assignee_read_at = NOW() WHERE assigned_to = ? AND assignee_read_at IS NULL',
      [req.user.id]
    );
    res.json({ success: true, message: 'Inbox marked as read' });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    await ensureTaskFilesTable();
    await ensureTaskReadColumns();
    const { search, status, priority, scope, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `${TASK_SELECT} WHERE 1=1`;
    const params = [];

    if (scope === 'inbox') {
      query += ' AND t.assigned_to = ?';
      params.push(req.user.id);
    } else if (scope === 'assigned') {
      query += ' AND t.assigned_by = ?';
      params.push(req.user.id);
    } else if (['gp', 'ahp'].includes(req.user.role)) {
      query += ' AND t.assigned_to = ?';
      params.push(req.user.id);
    }

    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
    if (search) {
      query += ` AND (
        t.title LIKE ?
        OR CONCAT(p.first_name, ' ', p.last_name) LIKE ?
        OR COALESCE(NULLIF(TRIM(CONCAT(COALESCE(ab_p.first_name, ''), ' ', COALESCE(ab_p.last_name, ''))), ''), ab.email) LIKE ?
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countQuery = query.replace(/SELECT t\.\*[\s\S]*FROM tasks t/, 'SELECT COUNT(*) as total FROM tasks t');
    const [countResult] = await pool.execute(countQuery, params);
    query += ' ORDER BY t.created_at DESC, t.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
    });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    await ensureTaskFilesTable();
    const [rows] = await pool.execute(`${TASK_SELECT} WHERE t.id = ?`, [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (!canAccessTask(rows[0], req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task' });
    }
    await ensureTaskUpdatesTable();
    const files = await listTaskFiles(req.params.id);
    const updates = await listTaskUpdates(req.params.id);
    res.json({ success: true, data: { ...rows[0], files, updates } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    await ensureTaskFilesTable();
    await ensureTaskReadColumns();
    const { title, description, assigned_to, due_date, priority, reminder_at } = req.body;
    const assigneeId = Number(assigned_to);
    if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
      return res.status(400).json({ success: false, message: 'Assignee is required' });
    }

    const n = (v) => (v === undefined || v === '' ? null : v);
    const selfAssigned = assigneeId === Number(req.user.id);
    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, due_date, priority, reminder_at, assignee_read_at, assigner_read_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ${selfAssigned ? 'NOW()' : 'NULL'}, NOW())`,
      [title, n(description), assigneeId, req.user.id, n(due_date), priority || 'medium', reminder_at || null]
    );

    await insertTaskFiles(result.insertId, req.files, req.user.id);

    if (!selfAssigned) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [assigneeId, 'Task Assigned', `New task: ${title}`, 'task']
      );
    }

    res.status(201).json({ success: true, message: 'Task created', data: { id: result.insertId } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    await ensureTaskFilesTable();
    await ensureTaskUpdatesTable();
    await ensureTaskReadColumns();
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    const task = tasks[0];

    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task' });
    }

    const statusOnly = req.body.status_only === 'true' || req.body.status_only === true;
    if (statusOnly || !canFullyEditTask(task, req.user)) {
      const updates = [];
      const values = [];
      if (req.body.status !== undefined) {
        updates.push('status = ?');
        values.push(req.body.status);
      }
      if (!updates.length && !req.files?.length && !String(req.body.task_update || '').trim()) {
        return res.status(400).json({ success: false, message: 'No valid fields to update' });
      }

      if (updates.length) {
        values.push(req.params.id);
        await pool.execute(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      const hasTaskUpdate = Boolean(String(req.body.task_update || '').trim());
      await insertTaskUpdate(req.params.id, req.user.id, req.body.task_update);
      await insertTaskFiles(req.params.id, req.files, req.user.id);

      const statusChanged = Boolean(req.body.status && req.body.status !== task.status);
      await notifyAssignerOfAssigneeUpdate(task, req.user.id, {
        statusChanged,
        newStatus: req.body.status,
        hasTaskUpdate,
      });

      return res.json({ success: true, message: 'Task updated' });
    }

    const fields = ['title', 'description', 'assigned_to', 'due_date', 'priority', 'status', 'reminder_at'];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] === undefined) return;
      updates.push(`${f} = ?`);
      values.push(req.body[f] === '' && f !== 'title' ? null : req.body[f]);
    });

    if (!updates.length && !req.files?.length) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    if (updates.length) {
      values.push(req.params.id);
      await pool.execute(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    await insertTaskFiles(req.params.id, req.files, req.user.id);
    await insertTaskUpdate(req.params.id, req.user.id, req.body.task_update);

    if (
      req.body.assigned_to !== undefined
      && Number(req.body.assigned_to) !== task.assigned_to
    ) {
      await ensureTaskReadColumns();
      await pool.execute(
        'UPDATE tasks SET assignee_read_at = NULL WHERE id = ?',
        [req.params.id]
      );
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [req.body.assigned_to, 'Task Assigned', `Task reassigned: ${task.title}`, 'task']
      );
    }

    res.json({ success: true, message: 'Task updated' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (!canAccessTask(tasks[0], req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task' });
    }
    await pool.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
};

exports.viewFile = async (req, res, next) => {
  try {
    await ensureTaskFilesTable();
    const { id, fileId } = req.params;
    const [rows] = await pool.execute(
      `SELECT f.original_name, f.stored_name, f.file_path, f.mime_type,
              t.assigned_to, t.assigned_by
       FROM task_files f
       JOIN tasks t ON f.task_id = t.id
       WHERE f.id = ? AND t.id = ?`,
      [fileId, id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    if (!canAccessTask(rows[0], req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this file' });
    }

    const file = rows[0];
    const absolutePath = resolveFilePath(file.file_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }

    const mimeType = resolveMimeType(file);
    const safeName = String(file.original_name || file.stored_name || 'attachment').replace(/"/g, '');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.sendFile(absolutePath);
  } catch (err) { next(err); }
};

exports.removeFile = async (req, res, next) => {
  try {
    await ensureTaskFilesTable();
    const { id, fileId } = req.params;
    const [rows] = await pool.execute(
      `SELECT f.id, t.assigned_to, t.assigned_by
       FROM task_files f
       JOIN tasks t ON f.task_id = t.id
       WHERE f.id = ? AND t.id = ?`,
      [fileId, id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    if (!canAccessTask(rows[0], req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this file' });
    }
    await pool.execute('DELETE FROM task_files WHERE id = ?', [fileId]);
    res.json({ success: true, message: 'File removed' });
  } catch (err) { next(err); }
};
