export const SESSION_EXPIRED_EVENT = 'amc:session-expired';

export const emitSessionExpired = (detail = {}) => {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail }));
};
