ALTER TABLE user_profiles
  ADD COLUMN date_of_birth DATE NULL AFTER phone,
  ADD COLUMN gender ENUM('male', 'female', 'other') NULL AFTER date_of_birth,
  ADD COLUMN nic VARCHAR(50) NULL AFTER gender,
  ADD COLUMN emergency_contact VARCHAR(100) NULL AFTER address;
