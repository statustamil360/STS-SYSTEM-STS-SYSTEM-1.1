export const openAppointmentFilePreview = (appointmentId, fileId) => {
  if (!appointmentId || !fileId) return;
  const url = `/appointments/${appointmentId}/files/${fileId}/preview`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
