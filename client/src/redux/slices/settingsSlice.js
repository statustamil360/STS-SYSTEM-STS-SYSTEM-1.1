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
        if (action.payload.timezone) state.timezone = action.payload.timezone;
        if (action.payload.hospital_name !== undefined) state.hospital_name = action.payload.hospital_name;
        if (action.payload.language) state.language = action.payload.language;
        if (action.payload.theme) state.theme = action.payload.theme;
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
