/** Shared helpers for CRUD form mapping and API payloads */

export const formatDateInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatTimeInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 5);
  return String(value);
};

export const emptyToNull = (value) => (value === undefined || value === '' ? null : value);

export const PATIENT_FORM_DEFAULTS = {
  first_name: '',
  last_name: '',
  dob: '',
  gender: '',
  nic: '',
  phone: '',
  land_phone: '',
  email: '',
  address: '',
  address_2: '',
  medical_history: '',
  emergency_contact: '',
  insurance: '',
  assigned_gp_id: '',
  assigned_ahp_id: '',
};

export const mapPatientToForm = (row) => {
  if (!row) return { ...PATIENT_FORM_DEFAULTS };
  return {
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    dob: formatDateInput(row.dob),
    gender: row.gender || '',
    nic: row.nic || '',
    phone: row.phone || '',
    land_phone: row.land_phone || '',
    email: row.email || '',
    address: row.address || '',
    address_2: row.address_2 || '',
    medical_history: row.medical_history || '',
    emergency_contact: row.emergency_contact || '',
    insurance: row.insurance || '',
    assigned_gp_id: row.assigned_gp_id != null ? String(row.assigned_gp_id) : '',
    assigned_ahp_id: row.assigned_ahp_id != null ? String(row.assigned_ahp_id) : '',
  };
};

export const buildPatientPayload = (formData) => ({
  first_name: formData.first_name?.trim(),
  last_name: formData.last_name?.trim(),
  dob: emptyToNull(formData.dob),
  gender: emptyToNull(formData.gender),
  nic: emptyToNull(formData.nic),
  phone: emptyToNull(formData.phone),
  land_phone: emptyToNull(formData.land_phone),
  email: emptyToNull(formData.email),
  address: emptyToNull(formData.address),
  address_2: emptyToNull(formData.address_2),
  medical_history: emptyToNull(formData.medical_history),
  emergency_contact: emptyToNull(formData.emergency_contact),
  insurance: emptyToNull(formData.insurance),
  assigned_gp_id: formData.assigned_gp_id ? Number(formData.assigned_gp_id) : null,
  assigned_ahp_id: formData.assigned_ahp_id ? Number(formData.assigned_ahp_id) : null,
});

export const buildTaskPayload = (formData, { editRow, isClinical }) => {
  if (isClinical && editRow) {
    return {
      status: formData.status || editRow.status,
      description: emptyToNull(formData.description),
    };
  }

  const payload = {
    title: formData.title?.trim(),
    description: emptyToNull(formData.description),
    due_date: emptyToNull(formData.due_date),
    priority: formData.priority || 'medium',
  };

  if (editRow) {
    payload.status = formData.status || editRow.status;
  }

  if (!isClinical) {
    payload.assigned_to = Number(formData.assigned_to);
  } else if (editRow?.assigned_to) {
    payload.assigned_to = Number(editRow.assigned_to);
  }

  return payload;
};
