-- Applied automatically at server startup via conferenceRecordingService.ensureSchema().
-- Manual run for existing databases:

-- ALTER TABLE appointments ADD COLUMN record_meeting TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE conferences ADD COLUMN record_meeting TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS conference_recordings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conference_id INT NOT NULL,
  status ENUM('requested', 'recording', 'ready', 'failed', 'not_recorded') NOT NULL DEFAULT 'requested',
  original_name VARCHAR(255),
  stored_name VARCHAR(255),
  file_path VARCHAR(500),
  mime_type VARCHAR(120) DEFAULT 'video/webm',
  file_size BIGINT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  recorder_user_id INT NULL,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
  INDEX idx_conference_recordings_conference (conference_id),
  INDEX idx_conference_recordings_status (status)
);
