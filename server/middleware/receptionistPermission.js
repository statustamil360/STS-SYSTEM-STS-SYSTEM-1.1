const { getBooleanSetting, clearSettingsCache } = require('../services/settingsService');
const {
  hasPermission,
  clearReceptionistPermissionCache,
} = require('../services/receptionistPermissionService');

const DOCUMENT_DOWNLOAD_KEYS = {
  gp: 'gp_can_download_documents',
  ahp: 'ahp_can_download_documents',
};

const assertClinicalDocumentDownload = async (req, res) => {
  if (req.query.download !== '1') return true;

  if (req.user?.role === 'receptionist') {
    if (await hasPermission(req.user.id, 'documents_download')) return true;
    res.status(403).json({
      success: false,
      message: 'Document download has been disabled for your account by the administrator',
    });
    return false;
  }

  const settingKey = DOCUMENT_DOWNLOAD_KEYS[req.user?.role];
  if (!settingKey) return true;

  if (await getBooleanSetting(settingKey, false)) return true;

  res.status(403).json({
    success: false,
    message: 'Document download has been disabled for your role by the administrator',
  });
  return false;
};

const clearPermissionCache = () => {
  clearSettingsCache();
  clearReceptionistPermissionCache();
};

/** Gate driven by a global admin setting that applies to every receptionist. */
const requireReceptionistPermission = (settingKey, deniedMessage) => async (req, res, next) => {
  try {
    if (req.user?.role !== 'receptionist') return next();

    if (await getBooleanSetting(settingKey)) return next();

    return res.status(403).json({ success: false, message: deniedMessage });
  } catch (err) {
    return next(err);
  }
};

/** Gate driven by a flag on the individual receptionist account. */
const requireReceptionistAction = (permissionKey, deniedMessage) => async (req, res, next) => {
  try {
    if (req.user?.role !== 'receptionist') return next();

    if (await hasPermission(req.user.id, permissionKey)) return next();

    return res.status(403).json({ success: false, message: deniedMessage });
  } catch (err) {
    return next(err);
  }
};

const canReceptionistEdit = requireReceptionistPermission(
  'receptionist_can_edit',
  'Editing has been disabled for receptionists by the administrator'
);

const canReceptionistDelete = requireReceptionistPermission(
  'receptionist_can_delete',
  'Deleting has been disabled for receptionists by the administrator'
);

module.exports = {
  canReceptionistEdit,
  canReceptionistDelete,
  requireReceptionistAction,
  assertClinicalDocumentDownload,
  clearPermissionCache,
};
