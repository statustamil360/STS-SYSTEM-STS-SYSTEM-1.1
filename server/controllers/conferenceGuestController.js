const guestService = require('../services/conferenceGuestService');

exports.createGuest = async (req, res, next) => {
  try {
    const { guest_name, guest_email, guest_role } = req.body;
    if (!guest_name?.trim() || !guest_email?.trim()) {
      return res.status(400).json({ success: false, message: 'Guest name and email are required' });
    }
    if (!['guest_gp', 'guest_ahp'].includes(guest_role)) {
      return res.status(400).json({ success: false, message: 'Guest role must be guest_gp or guest_ahp' });
    }

    const guest = await guestService.createGuestAccess({
      conferenceId: req.params.id,
      guestName: guest_name,
      guestEmail: guest_email,
      guestRole: guest_role,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Guest access created',
      data: guest,
    });
  } catch (err) { next(err); }
};

exports.listGuests = async (req, res, next) => {
  try {
    const guests = await guestService.listGuests(req.params.id);
    res.json({ success: true, data: guests });
  } catch (err) { next(err); }
};

exports.revokeGuest = async (req, res, next) => {
  try {
    const removed = await guestService.revokeGuest(req.params.guestId, req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }
    res.json({ success: true, message: 'Guest access removed' });
  } catch (err) { next(err); }
};

exports.getGuestCredentials = async (req, res, next) => {
  try {
    const guest = await guestService.getGuestCredentials(req.params.guestId, req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }
    res.json({ success: true, data: guest });
  } catch (err) { next(err); }
};

exports.resetGuestPassword = async (req, res, next) => {
  try {
    const guest = await guestService.resetGuestPassword(req.params.guestId, req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }
    res.json({ success: true, message: 'Password reset', data: guest });
  } catch (err) { next(err); }
};

exports.guestLoginInfo = async (req, res, next) => {
  try {
    const { access_code } = req.query;
    if (!access_code) {
      return res.status(400).json({ success: false, message: 'Access code required' });
    }
    const guest = await guestService.findGuestByCode(access_code);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Invalid or expired access code' });
    }
    res.json({
      success: true,
      data: {
        conferenceId: guest.conference_id,
        conferenceCode: guest.conference_code,
        guestName: guest.guest_name,
        guestEmail: guest.guest_email,
        joinUrl: guest.join_url,
      },
    });
  } catch (err) { next(err); }
};
