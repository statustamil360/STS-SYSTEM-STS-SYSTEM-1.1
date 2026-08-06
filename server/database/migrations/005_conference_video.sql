ALTER TABLE conferences
  ADD COLUMN appointment_id INT NULL AFTER conference_code,
  ADD COLUMN room_id VARCHAR(255) NULL AFTER meeting_link,
  ADD COLUMN accepted_at TIMESTAMP NULL AFTER room_id,
  ADD COLUMN accepted_by INT NULL AFTER accepted_at;

ALTER TABLE conferences
  ADD CONSTRAINT fk_conferences_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

ALTER TABLE conferences
  ADD CONSTRAINT fk_conferences_accepted_by
    FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_conferences_appointment ON conferences(appointment_id);
