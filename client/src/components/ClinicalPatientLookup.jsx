import { Autocomplete, Avatar, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SearchOutlined, VideoCallOutlined } from '@mui/icons-material';
import { fieldSx } from './PremiumFormFields';

export const patientDisplayName = (patient) => {
  if (!patient) return '';
  return patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
};

export const patientInitials = (patient) => {
  const name = patientDisplayName(patient);
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'P';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const ClinicalPatientLookup = ({
  patients,
  value,
  onChange,
  loading = false,
  formatDate,
}) => (
  <Autocomplete
    fullWidth
    options={patients}
    value={value}
    loading={loading}
    autoHighlight
    clearOnEscape
    noOptionsText="No assigned or conference patients found"
    getOptionLabel={(option) => {
      if (!option) return '';
      const name = patientDisplayName(option);
      return option.patient_code ? `${name} (${option.patient_code})` : name;
    }}
    isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
    onChange={(_, next) => onChange(next || null)}
    filterOptions={(options, state) => {
      const query = state.inputValue.trim().toLowerCase();
      if (!query) return options;
      return options.filter((patient) => {
        const haystack = [
          patientDisplayName(patient),
          patient.patient_code,
          patient.nic,
          patient.phone,
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }}
    renderOption={(props, option) => {
      const { key, ...optionProps } = props;
      const conferences = Number(option.conference_count) || 0;
      return (
        <Box
          component="li"
          key={key}
          {...optionProps}
          sx={{
            py: '10px !important',
            alignItems: 'flex-start !important',
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: 13,
              fontWeight: 700,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            {patientInitials(option)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {patientDisplayName(option)}
              </Typography>
              {conferences > 0 && (
                <Chip
                  size="small"
                  icon={<VideoCallOutlined sx={{ fontSize: '14px !important' }} />}
                  label={conferences === 1 ? '1 conference' : `${conferences} conferences`}
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.12),
                    color: 'secondary.dark',
                    '& .MuiChip-icon': { color: 'secondary.main', ml: 0.5 },
                  }}
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {option.patient_code || 'Patient'}
              {option.last_conference_date
                ? ` · Last meeting ${formatDate ? formatDate(option.last_conference_date) : String(option.last_conference_date).slice(0, 10)}`
                : ''}
            </Typography>
          </Box>
        </Box>
      );
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Patient lookup"
        placeholder="Search by name or patient ID"
        sx={fieldSx}
        InputLabelProps={{ shrink: true, ...params.InputLabelProps }}
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <>
              <SearchOutlined sx={{ ml: 0.5, mr: 0.5, color: 'text.secondary', fontSize: 20 }} />
              {params.InputProps?.startAdornment}
            </>
          ),
        }}
      />
    )}
  />
);

export default ClinicalPatientLookup;
