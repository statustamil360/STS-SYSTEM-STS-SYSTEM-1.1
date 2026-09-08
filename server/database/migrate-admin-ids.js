require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');

const formatAdminCode = (sequence) => `ADM-${String(sequence).padStart(2, '0')}`;

(async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [admins] = await connection.execute(
      'SELECT id FROM admins ORDER BY created_at ASC, id ASC'
    );

    await connection.execute("UPDATE admins SET admin_code = CONCAT('ADM-MIG-', id)");

    let sequence = 0;
    for (const admin of admins) {
      sequence += 1;
      const adminCode = formatAdminCode(sequence);
      await connection.execute(
        'UPDATE admins SET admin_code = ? WHERE id = ?',
        [adminCode, admin.id]
      );
      console.log(`Admin ${admin.id} -> ${adminCode}`);
    }

    await connection.commit();
    console.log(`Renumbered ${sequence} admin(s). Next ID: ${formatAdminCode(sequence + 1)}`);
    process.exit(0);
  } catch (err) {
    await connection.rollback();
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    connection.release();
  }
})();
