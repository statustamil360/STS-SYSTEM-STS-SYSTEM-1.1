import { useCallback, useEffect, useState } from 'react';
import {
  Fab, Dialog, DialogContent, IconButton, Box, keyframes, Zoom,
  Stack, TextField, Typography, Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ChecklistOutlined, CloseOutlined, AddOutlined, DeleteOutlined,
  RadioButtonUncheckedOutlined, CheckCircleOutlined,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';
import { ROLES } from '../utils/constants';
import { dialogPaperSx, dialogContentSx, fieldSx } from './PremiumFormFields';

const popPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(30, 58, 95, 0.35); }
  50% { transform: scale(1.08); box-shadow: 0 12px 32px rgba(30, 58, 95, 0.5); }
`;

const CALENDAR_ROLES = [ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.GP, ROLES.AHP];
const TODO_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.GP, ROLES.AHP];

const iconBtnBase = {
  width: 36,
  height: 36,
  borderRadius: 1.5,
};

const FloatingTodoButton = () => {
  const { user } = useSelector((state) => state.auth);
  const { receptionist_calendar_widget } = useSelector((state) => state.settings);
  const { calendarPopupEnabled, todoPopupEnabled } = useSelector((state) => state.ui);
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const role = user?.role;
  const calendarVisible = CALENDAR_ROLES.includes(role)
    && calendarPopupEnabled
    && !(role === ROLES.RECEPTIONIST && receptionist_calendar_widget === false);

  const loadTodos = useCallback(async () => {
    try {
      const { data } = await api.get('/todos');
      setTodos(data.data ?? []);
    } catch {
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    if (!TODO_ROLES.includes(role) || !todoPopupEnabled) return undefined;
    loadTodos();
    const timer = setInterval(loadTodos, 30000);
    return () => clearInterval(timer);
  }, [role, todoPopupEnabled, loadTodos]);

  useEffect(() => {
    if (open) loadTodos();
  }, [open, loadTodos]);

  const handleAdd = async () => {
    const title = draft.trim();
    if (!title) {
      toast.error('Please enter a to-do');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/todos', { title });
      setTodos((prev) => [data.data, ...prev.filter((item) => item.id !== data.data.id)]);
      setDraft('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to-do');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item) => {
    const next = !item.is_completed;
    setTodos((prev) => prev.map((todo) => (
      todo.id === item.id ? { ...todo, is_completed: next } : todo
    )));
    try {
      const { data } = await api.put(`/todos/${item.id}`, { is_completed: next });
      setTodos((prev) => {
        const others = prev.filter((todo) => todo.id !== item.id);
        const updated = data.data || { ...item, is_completed: next };
        return next ? [...others, updated] : [updated, ...others];
      });
    } catch {
      toast.error('Failed to update to-do');
      loadTodos();
    }
  };

  const handleDelete = async (item) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== item.id));
    try {
      await api.delete(`/todos/${item.id}`);
    } catch {
      toast.error('Failed to remove to-do');
      loadTodos();
    }
  };

  if (!TODO_ROLES.includes(role)) return null;
  if (!todoPopupEnabled) return null;

  const openCount = todos.filter((todo) => !todo.is_completed).length;
  const doneCount = todos.length - openCount;

  return (
    <>
      <Zoom in>
        <Box
          sx={{
            position: 'fixed',
            bottom: calendarVisible ? 80 : 24,
            right: 24,
            zIndex: (theme) => theme.zIndex.speedDial,
          }}
        >
          <Fab
            size="small"
            color="secondary"
            aria-label="Open to-do list"
            onClick={() => setOpen(true)}
            sx={{
              width: 44,
              height: 44,
              minHeight: 44,
              animation: `${popPulse} 2.4s ease-in-out infinite`,
            }}
          >
            <ChecklistOutlined sx={{ fontSize: 20 }} />
          </Fab>
        </Box>
      </Zoom>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            flexShrink: 0,
            color: 'common.white',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.light} 100%)`,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha('#FFFFFF', 0.18),
              }}
            >
              <ChecklistOutlined sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                To-do List
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.88 }}>
                Keep track of your work for today
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
              {todos.length > 0 && (
                <Chip
                  size="small"
                  label={`${openCount} open`}
                  sx={{
                    height: 24,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    bgcolor: alpha('#FFFFFF', 0.18),
                    color: 'common.white',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              )}
              <IconButton
                size="small"
                onClick={() => setOpen(false)}
                aria-label="Close to-do list"
                sx={{ color: 'common.white', bgcolor: alpha('#FFFFFF', 0.12), '&:hover': { bgcolor: alpha('#FFFFFF', 0.22) } }}
              >
                <CloseOutlined fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <DialogContent sx={{ ...dialogContentSx, pb: 3 }}>
          <Box
            component="form"
            onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
            sx={{ mb: 2.25 }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                fullWidth
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a to-do"
                disabled={submitting}
                sx={fieldSx}
              />
              <IconButton
                type="submit"
                aria-label="Add to-do"
                disabled={submitting || !draft.trim()}
                sx={{
                  ...iconBtnBase,
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  boxShadow: '0 6px 16px rgba(13, 148, 136, 0.28)',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.28),
                    color: 'common.white',
                  },
                }}
              >
                <AddOutlined />
              </IconButton>
            </Stack>
          </Box>

          {todos.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <Chip
                size="small"
                label={`${openCount} pending`}
                sx={{
                  height: 24,
                  fontWeight: 700,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.12),
                  color: 'info.dark',
                }}
              />
              <Chip
                size="small"
                label={`${doneCount} done`}
                sx={{
                  height: 24,
                  fontWeight: 700,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.12),
                  color: 'success.dark',
                }}
              />
            </Stack>
          )}

          {todos.length === 0 ? (
            <Box
              sx={{
                py: 5,
                textAlign: 'center',
                borderRadius: 2.5,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 1.5,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                }}
              >
                <ChecklistOutlined sx={{ fontSize: 28 }} />
              </Box>
              <Typography sx={{ fontWeight: 700 }}>No to-dos yet</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Add an item to keep track of your work
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {todos.map((item) => {
                const done = Boolean(item.is_completed);
                return (
                  <Stack
                    key={item.id}
                    direction="row"
                    spacing={1}
                    sx={{
                      position: 'relative',
                      alignItems: 'center',
                      pl: 1.75,
                      pr: 1,
                      py: 1,
                      minHeight: 56,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: done
                        ? (theme) => alpha(theme.palette.success.main, 0.22)
                        : (theme) => alpha(theme.palette.divider, 0.9),
                      bgcolor: done
                        ? (theme) => alpha(theme.palette.success.main, 0.06)
                        : 'background.paper',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        bgcolor: done ? 'success.main' : 'primary.main',
                      },
                    }}
                  >
                    <IconButton
                      size="small"
                      aria-label={done ? 'Mark as pending' : 'Mark as done'}
                      onClick={() => handleToggle(item)}
                      sx={{
                        ...iconBtnBase,
                        color: done ? 'success.main' : 'info.main',
                        bgcolor: (theme) => alpha(theme.palette[done ? 'success' : 'info'].main, 0.1),
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette[done ? 'success' : 'info'].main, 0.18),
                        },
                      }}
                    >
                      {done
                        ? <CheckCircleOutlined fontSize="small" />
                        : <RadioButtonUncheckedOutlined fontSize="small" />}
                    </IconButton>
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontWeight: 600,
                        textDecoration: done ? 'line-through' : 'none',
                        color: done ? 'text.secondary' : 'text.primary',
                        wordBreak: 'break-word',
                        lineHeight: 1.45,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <IconButton
                      size="small"
                      aria-label="Remove to-do"
                      onClick={() => handleDelete(item)}
                      sx={{
                        ...iconBtnBase,
                        color: 'error.main',
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette.error.main, 0.16),
                        },
                      }}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingTodoButton;
