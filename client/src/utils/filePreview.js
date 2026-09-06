import api from '../services/api';

export const openAppointmentFilePreview = (appointmentId, fileId) => {
  if (!appointmentId || !fileId) return;
  const url = `/appointments/${appointmentId}/files/${fileId}/preview`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const openTaskFilePreview = (taskId, fileId) => {
  if (!taskId || !fileId) return;
  const url = `/tasks/${taskId}/files/${fileId}/preview`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const downloadTaskFile = async (taskId, fileId, fileName = 'attachment') => {
  const { data, headers } = await api.get(`/tasks/${taskId}/files/${fileId}/view`, {
    responseType: 'blob',
  });
  const disposition = headers['content-disposition'] || '';
  const nameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  const resolvedName = nameMatch
    ? decodeURIComponent(nameMatch[1].replace(/"/g, ''))
    : fileName;
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = resolvedName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};
