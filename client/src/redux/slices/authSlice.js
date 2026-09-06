import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    if (data.data.user?.id) {
      sessionStorage.removeItem(`today_conf_popup_hide_${data.data.user.id}`);
      sessionStorage.removeItem(`today_conf_popup_remind_${data.data.user.id}`);
      sessionStorage.removeItem(`today_conf_popup_remind10_${data.data.user.id}`);
    }
    return data.data.user;
  } catch (err) {
    if (err.response?.status === 429) {
      return rejectWithValue(err.response?.data?.message || 'Too many login attempts. Please wait a few minutes and try again.');
    }
    if (!err.response) {
      return rejectWithValue('Cannot reach the server. Check that the backend is running on port 5000.');
    }
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_opts = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch { /* ignore */ }
  localStorage.clear();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    loading: false,
    profileLoading: !!localStorage.getItem('accessToken'),
    error: null,
    profileError: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    clearProfileError: (state) => { state.profileError = null; },
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.profileLoading = false;
      state.loading = false;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.profileLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProfile.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.profileLoading = true;
        }
        state.profileError = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        if (action.payload?.status && action.payload.status !== 'active') {
          state.user = null;
          state.isAuthenticated = false;
          state.profileError = 'Account deactivated';
          localStorage.clear();
          return;
        }
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.profileLoading = false;
        }
        state.profileError = action.payload || 'Session expired';
        state.user = null;
        state.isAuthenticated = false;
        localStorage.clear();
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.profileLoading = false;
      });
  },
});

export const { clearError, clearProfileError, clearSession } = authSlice.actions;
export default authSlice.reducer;
