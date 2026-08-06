ALTER TABLE conferences
  ADD COLUMN cancelled_reason VARCHAR(255) NULL AFTER status,
  ADD COLUMN cancelled_at TIMESTAMP NULL AFTER cancelled_reason;

ALTER TABLE appointments
  ADD COLUMN cancelled_reason VARCHAR(255) NULL AFTER status;
