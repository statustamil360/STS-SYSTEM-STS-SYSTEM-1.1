const setUserStatus = async (executor, userId, status) => {
  if (!status) return;

  if (status === 'active') {
    await executor.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    return;
  }

  await executor.execute(
    'UPDATE users SET status = ?, refresh_token = NULL WHERE id = ?',
    [status, userId]
  );
};

const invalidateUserSessions = async (executor, userId) => {
  await executor.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [userId]);
};

module.exports = { setUserStatus, invalidateUserSessions };
