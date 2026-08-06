-- Extended appointments for conference scheduling with multiple AHPs and file attachments

ALTER TABLE appointments
  ADD COLUMN appointment_code VARCHAR(50) UNIQUE NULL AFTER id,
  ADD COLUMN title VARCHAR(255) NULL AFTER ahp_id,
  ADD COLUMN important_note TEXT NULL AFTER title,
  ADD COLUMN comments TEXT NULL AFTER important_note,
  ADD COLUMN patient_previous_records TEXT NULL AFTER comments;

CREATE TABLE IF NOT EXISTS appointment_ahps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT NOT NULL,
  profession VARCHAR(100) NOT NULL,
  ahp_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (ahp_id) REFERENCES allied_health_professionals(id) ON DELETE CASCADE,
  UNIQUE KEY unique_appointment_profession_ahp (appointment_id, profession, ahp_id)
);

CREATE TABLE IF NOT EXISTS appointment_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NULL,
  mime_type VARCHAR(100) NULL,
  uploaded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_appointment_ahps_appointment ON appointment_ahps(appointment_id);
CREATE INDEX idx_appointment_files_appointment ON appointment_files(appointment_id);
