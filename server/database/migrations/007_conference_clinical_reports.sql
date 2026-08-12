-- Clinical reports, guest access, generated documents, and edit requests

CREATE TABLE IF NOT EXISTS conference_clinical_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conference_id INT NOT NULL,
  user_id INT NOT NULL,
  participant_role ENUM('gp', 'ahp', 'guest_gp', 'guest_ahp') NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  assessment LONGTEXT,
  recommendations LONGTEXT,
  conclusion LONGTEXT,
  edit_locked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conf_report_user (conference_id, user_id),
  FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conference_guest_access (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conference_id INT NOT NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_role ENUM('guest_gp', 'guest_ahp') NOT NULL,
  access_code VARCHAR(32) NOT NULL UNIQUE,
  temp_password_hash VARCHAR(255) NOT NULL,
  user_id INT NULL,
  join_url VARCHAR(500),
  created_by INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conference_generated_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conference_id INT NOT NULL,
  participant_user_id INT NOT NULL,
  participant_name VARCHAR(255) NOT NULL,
  file_type ENUM('pdf', 'docx') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conference_report_edit_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conference_id INT NOT NULL,
  user_id INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Track when the meeting ended for the 1-hour edit window
ALTER TABLE conferences
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP NULL AFTER accepted_by;
