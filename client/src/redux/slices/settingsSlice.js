import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { DEFAULT_TIMEZONE } from '../../utils/timezones';

export const fetchSystemSettings = createAsyncThunk(
  'settings/fetchSystemSettings',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/settings/public');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load system settings');
    }
  },
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    timezone: localStorage.getItem('system_timezone') || DEFAULT_TIMEZONE,
    hospital_name: '',
    language: 'en',
    theme: 'light',
    receptionist_can_edit: true,
    receptionist_can_delete: true,
    receptionist_calendar_widget: true,
    gp_conference_popup: true,
    ahp_conference_popup: true,
    gp_can_edit: true,
    gp_can_delete: false,
    ahp_can_edit: true,
    ahp_can_delete: false,
    dark_mode_allowed: true,
    receptionist_dark_mode_allowed: true,
    gp_dark_mode_allowed: true,
    ahp_dark_mode_allowed: true,
    gp_can_download_documents: false,
    ahp_can_download_documents: false,
    conference_open_lead_minutes: 15,
    loaded: false,
  },
  reducers: {
    updateSystemSettings: (state, action) => {
      Object.assign(state, action.payload);
      if (action.payload.timezone) {
        localStorage.setItem('system_timezone', action.payload.timezone);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.loaded = true;
        localStorage.setItem('system_timezone', state.timezone);
      })
      .addCase(fetchSystemSettings.rejected, (state) => {
        state.loaded = true;
      });
  },
});

export const { updateSystemSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
