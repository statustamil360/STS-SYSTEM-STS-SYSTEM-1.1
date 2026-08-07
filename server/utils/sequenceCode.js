/** Shared numbering for human-readable record codes: 4 digits, widening up to 10. */
const DIGIT_TIERS = [
  { max: 9999, digits: 4 },
  { max: 99999, digits: 5 },
  { max: 999999, digits: 6 },
  { max: 9999999, digits: 7 },
  { max: 99999999, digits: 8 },
  { max: 999999999, digits: 9 },
  { max: 9999999999, digits: 10 },
];

const SAFE_TABLE = /^[a-z_]+$/;

const assertTable = (table) => {
  if (!SAFE_TABLE.test(table || '')) {
    throw new Error(`Invalid sequence table name: ${table}`);
  }
};

const formatSequenceCode = (prefix, sequenceNumber) => {
  const n = Number(sequenceNumber);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid ${prefix} sequence number`);
  }

  const tier = DIGIT_TIERS.find((t) => n <= t.max);
  if (!tier) {
    throw new Error(`${prefix} ID limit reached (10 digits)`);
  }

  return `${prefix}-${String(n).padStart(tier.digits, '0')}`;
};

/** DDL implicitly commits in MySQL — call this before opening a transaction. */
const ensureSequenceTable = async (connection, table) => {
  assertTable(table);
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ${table} (
      id INT PRIMARY KEY DEFAULT 1,
      last_number BIGINT NOT NULL DEFAULT 0
    )
  `);
  await connection.execute(`INSERT IGNORE INTO ${table} (id, last_number) VALUES (1, 0)`);
};

/** Reserves the next number. Run inside the caller's transaction so the row lock holds. */
const allocateSequenceNumber = async (connection, table) => {
  assertTable(table);
  const [rows] = await connection.execute(
    `SELECT last_number FROM ${table} WHERE id = 1 FOR UPDATE`
  );
  const nextNumber = Number(rows[0]?.last_number ?? 0) + 1;

  if (rows.length) {
    await connection.execute(`UPDATE ${table} SET last_number = ? WHERE id = 1`, [nextNumber]);
  } else {
    await connection.execute(`INSERT INTO ${table} (id, last_number) VALUES (1, ?)`, [nextNumber]);
  }

  return nextNumber;
};

module.exports = { formatSequenceCode, ensureSequenceTable, allocateSequenceNumber };
