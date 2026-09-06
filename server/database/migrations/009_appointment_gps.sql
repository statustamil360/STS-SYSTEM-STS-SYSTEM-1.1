-- One appointment can be assigned to any number of GPs

CREATE TABLE IF NOT EXISTS appointment_gps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT NOT NULL,
  gp_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (gp_id) REFERENCES gps(id) ON DELETE CASCADE,
  UNIQUE KEY unique_appointment_gp (appointment_id, gp_id)
);

CREATE INDEX idx_appointment_gps_appointment ON appointment_gps(appointment_id);

-- Backfill the single GP already stored on each appointment
INSERT IGNORE INTO appointment_gps (appointment_id, gp_id)
SELECT id, gp_id FROM appointments WHERE gp_id IS NOT NULL;
