-- Per-participant join sessions for salary / attendance tracking (supports rejoins)
CREATE TABLE IF NOT EXISTS conference_participant_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conference_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_cps_conf_user (conference_id, user_id),
  INDEX idx_cps_open (conference_id, left_at)
);
