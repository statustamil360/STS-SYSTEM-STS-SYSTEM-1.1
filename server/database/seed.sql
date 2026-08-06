USE amc_teleconference;

INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Highest authority - system owner'),
  ('admin', 'Hospital/clinic administrator'),
  ('receptionist', 'Front desk and daily workflow manager'),
  ('gp', 'General Practitioner'),
  ('ahp', 'Allied Health Professional');

-- Default password for all seed users: Admin@123
-- bcrypt hash generated for 'Admin@123'
SET @pwd = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2oQKqKqKqKqKq';

INSERT INTO users (role_id, email, username, password_hash, status) VALUES
  (1, 'superadmin@amc.com', 'superadmin', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active');

INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES
  (1, 'Super', 'Admin', '+94770000001');

INSERT INTO settings (setting_key, setting_value) VALUES
  ('hospital_name', 'AMC Healthcare'),
  ('logo', ''),
  ('email_settings', '{"smtp_host":"","smtp_port":587,"from_email":"noreply@amc.com"}'),
  ('sms_settings', '{"provider":"","api_key":""}'),
  ('timezone', 'Asia/Colombo'),
  ('language', 'en'),
  ('theme', 'light'),
  ('backup_settings', '{"auto_backup":true,"frequency":"daily"}');
