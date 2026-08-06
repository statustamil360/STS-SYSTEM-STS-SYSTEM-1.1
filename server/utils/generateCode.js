const generateCode = (prefix) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const generateSequentialCode = async (conn, prefix, table, codeField, padLength = 2) => {
  const [rows] = await conn.execute(`SELECT ${codeField} AS code FROM ${table}`);
  const nums = rows
    .map((row) => row.code)
    .filter((code) => code && code.startsWith(`${prefix}-`))
    .map((code) => parseInt(code.slice(prefix.length + 1), 10))
    .filter((num) => !Number.isNaN(num));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(padLength, '0')}`;
};

module.exports = { generateCode, generateSequentialCode };
