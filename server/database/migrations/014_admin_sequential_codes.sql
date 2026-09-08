-- Renumber admin_code values to sequential ADM-01, ADM-02, ...
-- Unique constraint requires a temporary value first.

UPDATE admins SET admin_code = CONCAT('ADM-MIG-', id);

UPDATE admins a
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM admins
) ranked ON ranked.id = a.id
SET a.admin_code = CONCAT('ADM-', LPAD(ranked.rn, 2, '0'));
