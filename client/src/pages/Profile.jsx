import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Button, Grid, Avatar, Alert, Stack,
  IconButton, Paper, Divider, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PhotoCameraOutlined,
  PersonOutlined, PhoneOutlined, LocationOnOutlined, LockOutlined,
  BadgeOutlined, EmailOutlined, SaveOutlined, VpnKeyOutlined,
  CalendarTodayOutlined, WcOutlined, MedicalServicesOutlined,
  HealthAndSafetyOutlined, EventOutlined, VerifiedUserOutlined,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '../redux/slices/authSlice';
import api from '../services/api';
import { ROLE_LABELS, ROLES, formatWeekdays, parseWeekdays } from '../utils/constants';
import useSystemDateTime from '../hooks/useSystemDateTime';
import { IconField } from '../components/PremiumFormFields';
import { changePasswordSchema } from '../utils/formSchemas';

const SectionCard = ({ title, subtitle, icon: Icon, children, accent = 'primary' }) => (
  <Paper
    elevation={0}
    sx={{
      overflow: 'hidden',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
    }}
  >
    <Box
      sx={{
        px: { xs: 2.5, sm: 3 },
        py: 2,
        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette[accent].dark, 0.92)} 0%, ${alpha(theme.palette[accent].main, 0.88)} 55%, ${alpha(theme.palette[accent].light, 0.85)} 100%)`,
        color: 'common.white',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha('#FFFFFF', 0.15),
            border: '1px solid',
            borderColor: alpha('#FFFFFF', 0.25),
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>{children}</Box>
  </Paper>
);

const formatGenderLabel = (value) => {
  if (!value) return '';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

const Profile = () => {
  const dispatch = useDispatch();
  const { formatDate } = useSystemDateTime();
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const {
    register: regPwd,
    handleSubmit: submitPwd,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || user.profile?.first_name || '',
        last_name: user.last_name || user.profile?.last_name || '',
        phone: user.phone || user.profile?.phone || '',
        address: user.address || user.profile?.address || '',
      });
    }
  }, [user, reset]);

  const onSubmitProfile = async (data) => {
    setSavingProfile(true);
    setProfileSuccess('');
    try {
      await api.put('/auth/profile', data);
      dispatch(fetchProfile());
      setProfileSuccess('Profile updated successfully');
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onSubmitPassword = async (data) => {
    setChangingPassword(true);
    setPasswordMsg('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPwd();
      toast.success('Password changed successfully');
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB');
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(fetchProfile());
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const displayName = `${user?.first_name || user?.profile?.first_name || ''} ${user?.last_name || user?.profile?.last_name || ''}`.trim();
  const profilePicture = user?.profile?.profile_picture || user?.profile_picture;
  const initial = displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase();
  const availabilityLabel = formatWeekdays(parseWeekdays(user?.availability));
  const extraProfileRows = user?.role === ROLES.RECEPTIONIST
    ? [
      { icon: BadgeOutlined, label: 'Receptionist ID', value: user.receptionist_code },
      { icon: CalendarTodayOutlined, label: 'Date of Birth', value: user.date_of_birth ? formatDate(user.date_of_birth) : '' },
      { icon: WcOutlined, label: 'Gender', value: formatGenderLabel(user.gender) },
      { icon: VerifiedUserOutlined, label: 'National ID (NIC)', value: user.nic },
    ]
    : user?.role === ROLES.GP
      ? [
        { icon: MedicalServicesOutlined, label: 'GP ID', value: user.gp_code },
        { icon: MedicalServicesOutlined, label: 'Specialization', value: user.specialization },
        { icon: VerifiedUserOutlined, label: 'Registration Number', value: user.registration_number },
        { icon: EventOutlined, label: 'Availability', value: availabilityLabel },
      ]
      : user?.role === ROLES.AHP
        ? [
          { icon: HealthAndSafetyOutlined, label: 'AHP ID', value: user.ahp_code },
          { icon: HealthAndSafetyOutlined, label: 'Profession', value: user.profession },
          { icon: VerifiedUserOutlined, label: 'Registration Number', value: user.registration_number },
          { icon: EventOutlined, label: 'Availability', value: availabilityLabel },
        ]
        : [];

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
            height: '100%',
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 4,
              textAlign: 'center',
              background: (theme) => `linear-gradient(160deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
              color: 'common.white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  src={profilePicture || undefined}
                  sx={{
                    width: 108,
                    height: 108,
                    mx: 'auto',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    bgcolor: alpha('#FFFFFF', 0.18),
                    border: '3px solid',
                    borderColor: alpha('#FFFFFF', 0.35),
                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                  }}
                >
                  {initial}
                </Avatar>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 36,
                    height: 36,
                    bgcolor: 'background.paper',
                    color: 'primary.main',
                    border: '2px solid',
                    borderColor: alpha('#FFFFFF', 0.5),
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: 'background.paper', transform: 'scale(1.05)' },
                    transition: 'transform 120ms ease',
                  }}
                >
                  {uploadingPhoto ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <PhotoCameraOutlined sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>
                {displayName || user?.email}
              </Typography>
              <ChipLike label={ROLE_LABELS[user?.role]} />
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              <ProfileInfoRow icon={EmailOutlined} label="Email" value={user?.email} />
              <ProfileInfoRow icon={PhoneOutlined} label="Phone" value={user?.phone || user?.profile?.phone} />
              <ProfileInfoRow icon={BadgeOutlined} label="Role" value={ROLE_LABELS[user?.role]} />
              {extraProfileRows.map((row) => (
                <ProfileInfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
              ))}
            </Stack>
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={3}>
          <SectionCard
            title="Update Profile"
            subtitle="Edit your personal and contact information"
            icon={PersonOutlined}
          >
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setProfileSuccess('')}>
                {profileSuccess}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit(onSubmitProfile)}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <IconField label="First Name" icon={PersonOutlined} name="first_name" register={register} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <IconField label="Last Name" icon={PersonOutlined} name="last_name" register={register} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <IconField label="Phone" icon={PhoneOutlined} name="phone" register={register} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <IconField label="Address" icon={LocationOnOutlined} name="address" register={register} multiline rows={2} />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2.5 }} />
              <Button
                type="submit"
                variant="contained"
                disabled={savingProfile}
                startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: '0 6px 16px rgba(30, 58, 95, 0.2)',
                  '&:hover': { boxShadow: '0 8px 20px rgba(30, 58, 95, 0.26)' },
                }}
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </SectionCard>

          <SectionCard
            title="Change Password"
            subtitle="Update your account password for secure access"
            icon={LockOutlined}
            accent="secondary"
          >
            {passwordMsg && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{passwordMsg}</Alert>
            )}
            <Box component="form" onSubmit={submitPwd(onSubmitPassword)}>
              <Stack spacing={2}>
                <IconField
                  label="Current Password"
                  icon={VpnKeyOutlined}
                  name="currentPassword"
                  type="password"
                  register={regPwd}
                  required
                  error={!!pwdErrors.currentPassword}
                  helperText={pwdErrors.currentPassword?.message}
                />
                <IconField
                  label="New Password"
                  icon={LockOutlined}
                  name="newPassword"
                  type="password"
                  register={regPwd}
                  required
                  error={!!pwdErrors.newPassword}
                  helperText={pwdErrors.newPassword?.message || 'Minimum 8 characters'}
                />
                <IconField
                  label="Retype New Password"
                  icon={LockOutlined}
                  name="confirmNewPassword"
                  type="password"
                  register={regPwd}
                  required
                  error={!!pwdErrors.confirmNewPassword}
                  helperText={pwdErrors.confirmNewPassword?.message}
                />
              </Stack>
              <Divider sx={{ my: 2.5 }} />
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                disabled={changingPassword}
                startIcon={changingPassword ? <CircularProgress size={16} color="inherit" /> : <VpnKeyOutlined />}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: '0 6px 16px rgba(30, 58, 95, 0.2)',
                  '&:hover': { boxShadow: '0 8px 20px rgba(30, 58, 95, 0.26)' },
                }}
              >
                {changingPassword ? 'Updating...' : 'Change Password'}
              </Button>
            </Box>
          </SectionCard>
        </Stack>
      </Grid>
    </Grid>
  );
};

const ChipLike = ({ label }) => (
  <Box
    sx={{
      display: 'inline-flex',
      px: 1.5,
      py: 0.375,
      borderRadius: 10,
      bgcolor: alpha('#FFFFFF', 0.15),
      border: '1px solid',
      borderColor: alpha('#FFFFFF', 0.3),
    }}
  >
    <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
      {label}
    </Typography>
  </Box>
);

const ProfileInfoRow = ({ icon: Icon, label, value }) => (
  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        color: 'primary.main',
      }}
    >
      <Icon sx={{ fontSize: 18 }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  </Stack>
);

export default Profile;
