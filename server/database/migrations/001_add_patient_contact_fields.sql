ALTER TABLE patients
  ADD COLUMN land_phone VARCHAR(20) NULL AFTER phone,
  ADD COLUMN address_2 TEXT NULL AFTER address;
