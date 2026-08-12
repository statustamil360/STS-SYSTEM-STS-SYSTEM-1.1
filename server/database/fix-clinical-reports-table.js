require('dotenv').config();
const pool = require('../config/db');

pool.query(`
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
)
`).then(() => {
  console.log('conference_clinical_reports OK');
  return pool.end();
}).catch((e) => { console.error(e); process.exit(1); });
