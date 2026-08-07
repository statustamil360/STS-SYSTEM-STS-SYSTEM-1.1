export const SELECT_PLACEHOLDER = '-- Select --';

const PLACEHOLDERS = {
  name: 'e.g. Dr. John Smith',
  first_name: 'e.g. John',
  last_name: 'e.g. Smith',
  email: 'e.g. name@amc.com',
  phone: 'e.g. +94 77 123 4567',
  land_phone: 'e.g. +94 11 234 5678',
  address: 'e.g. 123 Main Street, Colombo',
  address_2: 'e.g. Apartment 4B',
  nic: 'e.g. 199012345678',
  emergency_contact: 'e.g. Jane Smith — +94 77 987 6543',
  specialization: 'e.g. General Medicine',
  registration_number: 'e.g. SLMC 12345',
  hospital: 'e.g. Colombo General Hospital',
  insurance: 'e.g. National Insurance Co.',
  medical_history: 'e.g. Diabetes, hypertension...',
  meeting_link: 'e.g. https://meet.example.com/room-id',
  notes: 'e.g. Follow-up in 2 weeks',
  title: 'e.g. Weekly team review',
  description: 'e.g. Prepare patient summary before call',
  subject: 'e.g. Appointment reminder',
  message: 'e.g. Your appointment is confirmed for...',
  report_title: 'e.g. Initial Assessment Report',
  report_content: 'e.g. Patient presented with...',
  note_content: 'e.g. Patient reported mild discomfort...',
  note_title: 'e.g. Follow-up consultation',
  hospital_name: 'e.g. AMC Teleconference Centre',
  profession_name: 'e.g. Physiotherapist',
  currentPassword: 'Enter current password',
  password: 'Enter password',
  newPassword: 'Enter new password',
  confirmPassword: 'Re-enter password',
  confirmNewPassword: 'Re-enter new password',
};

export const shouldShowSelectPlaceholder = ({ defaultValue, showSelectPlaceholder } = {}) => {
  if (showSelectPlaceholder === false) return false;
  if (showSelectPlaceholder === true) return true;
  return defaultValue === undefined || defaultValue === '' || defaultValue === null;
};

/** MUI v9 MenuProps — portal + elevated z-index keeps menus clickable inside dialogs. */
export const selectMenuSlotProps = {
  disablePortal: false,
  disableScrollLock: true,
  slotProps: {
    paper: {
      sx: {
        maxHeight: 320,
        zIndex: (theme) => theme.zIndex.modal + 2,
      },
    },
  },
};

export const getSelectSlotProps = ({ defaultValue, showSelectPlaceholder, options } = {}) => {
  const selectProps = {
    MenuProps: selectMenuSlotProps,
  };

  if (!shouldShowSelectPlaceholder({ defaultValue, showSelectPlaceholder })) {
    return selectProps;
  }

  return {
    ...selectProps,
    displayEmpty: true,
    renderValue: (selected) => {
      if (selected === '' || selected === undefined || selected === null) {
        return SELECT_PLACEHOLDER;
      }
      if (options?.length) {
        const match = options.find((opt) => String(opt.value) === String(selected));
        if (match) return match.label;
      }
      return selected;
    },
  };
};

export const getFieldPlaceholder = (name, { type, select, label } = {}) => {
  if (select || type === 'date' || type === 'time') return undefined;
  if (type === 'password') {
    if (name?.includes('confirm') || name?.includes('Confirm')) return 'Re-enter password';
    if (name === 'currentPassword') return 'Enter current password';
    return 'Enter password';
  }
  if (name && PLACEHOLDERS[name]) return PLACEHOLDERS[name];
  if (label) {
    const normalized = label.toLowerCase();
    if (normalized.includes('email')) return 'e.g. name@amc.com';
    if (normalized.includes('phone')) return 'e.g. +94 77 123 4567';
    if (normalized.includes('address')) return 'e.g. 123 Main Street, Colombo';
    if (normalized.includes('name')) return 'e.g. John Smith';
    if (normalized.includes('notes') || normalized.includes('description') || normalized.includes('history')) {
      return 'Enter details here...';
    }
  }
  return undefined;
};
