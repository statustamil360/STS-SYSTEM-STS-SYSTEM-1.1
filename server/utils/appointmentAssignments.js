/** Multipart requests send assignment lists as JSON strings, JSON requests send real arrays. */
const parseArrayField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * One appointment can be assigned to any number of GPs. `gp_ids` is the current
 * shape; a lone `gp_id` is still accepted so older clients keep working.
 */
const parseGpIds = (body) => {
  const fromList = parseArrayField(body.gp_ids)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  if (fromList.length) return [...new Set(fromList)];

  const single = Number(body.gp_id);
  return Number.isInteger(single) && single > 0 ? [single] : [];
};

module.exports = { parseArrayField, parseGpIds };
