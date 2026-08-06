import * as yup from 'yup';

export const phoneSchema = yup.string()
  .nullable()
  .transform((v) => (v === '' ? null : v))
  .matches(/^\+?[\d\s-]{8,15}$/, 'Enter a valid phone number (8–15 digits)');

export const staffCreateSchema = yup.object({
  name: yup.string().trim().required('Full name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: phoneSchema.nullable(),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  status: yup.string().oneOf(['active', 'inactive']).default('active'),
  specialization: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  registration_number: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  hospital: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  availability: yup.mixed().nullable().transform((v) => {
    if (Array.isArray(v)) return v.length ? v.join(', ') : '';
    return v === '' ? '' : v;
  }),
  profession: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
});

export const staffEditSchema = yup.object({
  name: yup.string().trim().required('Full name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: phoneSchema.nullable(),
  status: yup.string().oneOf(['active', 'inactive', 'disabled']).required('Status is required'),
  specialization: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  registration_number: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  hospital: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  availability: yup.mixed().nullable().transform((v) => {
    if (Array.isArray(v)) return v.length ? v.join(', ') : '';
    return v === '' ? '' : v;
  }),
  profession: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  date_of_birth: yup.string().nullable().transform((v) => (v === '' ? null : v)),
  gender: yup.string().nullable().transform((v) => (v === '' ? null : v)),
  nic: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  address: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
  emergency_contact: yup.string().nullable().transform((v) => (v === '' ? null : v?.trim())),
});

export const adminCreateSchema = staffCreateSchema;
export const adminEditSchema = staffEditSchema.shape({
  newPassword: yup.string().transform((v) => v || undefined).optional()
    .min(8, 'Password must be at least 8 characters'),
  confirmNewPassword: yup.string().when('newPassword', {
    is: (val) => Boolean(val),
    then: (schema) => schema
      .oneOf([yup.ref('newPassword')], 'Passwords must match')
      .required('Confirm the new password'),
    otherwise: (schema) => schema.optional(),
  }),
});

export const receptionistProfileFields = {
  date_of_birth: yup.string()
    .nullable()
    .transform((v) => (v === '' ? null : v))
    .test('valid-date', 'Enter a valid date of birth', (v) => !v || !Number.isNaN(new Date(v).getTime())),
  gender: yup.string()
    .nullable()
    .transform((v) => (v === '' ? null : v))
    .oneOf(['male', 'female', 'other', null], 'Select a valid gender'),
  nic: yup.string()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim()))
    .max(50, 'National ID must be 50 characters or less'),
  address: yup.string()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim())),
  emergency_contact: yup.string()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim()))
    .max(100, 'Emergency contact must be 100 characters or less'),
};

export const receptionistCreateSchema = staffCreateSchema.shape({
  phone: yup.string().trim().required('Phone number is required')
    .matches(/^\+?[\d\s-]{8,15}$/, 'Enter a valid phone number (8–15 digits)'),
  ...receptionistProfileFields,
});

export const receptionistEditSchema = staffEditSchema.shape({
  phone: yup.string().trim().required('Phone number is required')
    .matches(/^\+?[\d\s-]{8,15}$/, 'Enter a valid phone number (8–15 digits)'),
  ...receptionistProfileFields,
});

export const staffPasswordResetSchema = yup.object({
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export const adminPasswordResetSchema = staffPasswordResetSchema;

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirmNewPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please retype your new password'),
});
