import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Paper, Chip, IconButton,
  CircularProgress, Stack, Tooltip, MenuItem, TableSortLabel, alpha, Button,
} from '@mui/material';
import {
  SearchOutlined, EditOutlined, DeleteOutlined, LockResetOutlined,
  FilterListOutlined, CloseOutlined, InboxOutlined, VisibilityOutlined, Add,
} from '@mui/icons-material';
import { STATUS_COLORS } from '../utils/constants';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'background.default',
    fontSize: '0.875rem',
    '& fieldset': { borderColor: alpha('#64748B', 0.22) },
    '&:hover fieldset': { borderColor: alpha('#64748B', 0.4) },
    '&.Mui-focused': {
      bgcolor: 'background.paper',
      boxShadow: '0 0 0 3px rgba(30, 58, 95, 0.08)',
    },
  },
};

const DataTable = ({
  title,
  columns,
  rows,
  loading,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onSearch,
  onEdit,
  onDelete,
  onView,
  onResetPassword,
  searchPlaceholder = 'Search records...',
  actions = true,
  filters = [],
  defaultSortField = null,
  defaultSortOrder = 'asc',
  serverSort = false,
  sortField: controlledSortField,
  sortOrder: controlledSortOrder,
  onSortChange,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Add,
  showRowNumbers = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  const activeSortField = serverSort ? controlledSortField : sortField;
  const activeSortOrder = serverSort ? controlledSortOrder : sortOrder;

  useEffect(() => {
    if (!onSearchRef.current) return undefined;
    const timer = setTimeout(() => onSearchRef.current(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSort = (field) => {
    if (serverSort) {
      const nextOrder = activeSortField === field
        ? (activeSortOrder === 'asc' ? 'desc' : 'asc')
        : 'desc';
      onSortChange?.(field, nextOrder);
      return;
    }
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const safeRows = rows ?? [];

  const sortedRows = useMemo(() => {
    if (serverSort || !sortField) return safeRows;
    return [...safeRows].sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [safeRows, sortField, sortOrder, serverSort]);

  const displayRows = serverSort ? safeRows : sortedRows;

  const colSpan = columns.length + (actions ? 1 : 0) + (showRowNumbers ? 1 : 0);
  const activeFilters = filters.filter((f) => f.value !== '' && f.value !== undefined && f.value !== null);
  const from = total ? page * rowsPerPage + 1 : 0;
  const to = total ? Math.min((page + 1) * rowsPerPage, total) : 0;

  const isCodeField = (field) => field === 'patient_code' || (typeof field === 'string' && field.endsWith('_code'));

  return (
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
      {(title || onSearch || filters.length > 0 || actionLabel) && (
        <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.5, pb: 2 }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0, flexWrap: 'wrap', gap: 1 }}>
              {title && (
                <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {title}
                </Typography>
              )}
              {total !== undefined && !loading && (
                <Chip
                  label={`${total} record${total === 1 ? '' : 's'}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                  }}
                />
              )}
              {activeFilters.length > 0 && (
                <Chip
                  label={`${activeFilters.length} filter${activeFilters.length === 1 ? '' : 's'}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
                />
              )}
            </Stack>

            {actionLabel && onAction && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ActionIcon />}
                onClick={onAction}
                sx={{
                  flexShrink: 0,
                  px: 2,
                  py: 0.875,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  boxShadow: '0 6px 16px rgba(30, 58, 95, 0.2)',
                  '&:hover': { boxShadow: '0 8px 20px rgba(30, 58, 95, 0.26)' },
                }}
              >
                {actionLabel}
              </Button>
            )}
          </Stack>

          {(onSearch || filters.length > 0) && (
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { lg: 'center' }, flexWrap: 'wrap' }}
            >
              {onSearch && (
                <TextField
                  size="small"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ ...fieldSx, flex: { lg: '1 1 240px' }, minWidth: { xs: '100%', sm: 220 }, maxWidth: { lg: 320 } }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                            <CloseOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                />
              )}

              {filters.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <FilterListOutlined sx={{ fontSize: 18, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
                  {filters.map((filter) => (
                    <TextField
                      key={filter.key}
                      select
                      size="small"
                      label={filter.label}
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                      sx={{ ...fieldSx, minWidth: 140 }}
                    >
                      {filter.options.map((opt) => (
                        <MenuItem key={String(opt.value)} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                  ))}
                  {activeFilters.length > 0 && (
                    <Tooltip title="Clear all filters">
                      <IconButton
                        size="small"
                        onClick={() => filters.forEach((f) => f.onChange(''))}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                      >
                        <CloseOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              )}
            </Stack>
          )}
        </Box>
      )}

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="medium">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                '& .MuiTableCell-head': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
              }}
            >
              {showRowNumbers && (
                <TableCell sx={{ py: 1.5, width: 56 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                    }}
                  >
                    #
                  </Typography>
                </TableCell>
              )}
              {columns.map((col) => {
                const sortable = col.sortable !== false && col.field;
                return (
                  <TableCell key={col.field} sx={{ py: 1.5, whiteSpace: 'nowrap' }}>
                    {sortable ? (
                      <TableSortLabel
                        active={activeSortField === col.field}
                        direction={activeSortField === col.field ? activeSortOrder : 'asc'}
                        onClick={() => handleSort(col.field)}
                        sx={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: activeSortField === col.field ? 'primary.main' : 'text.secondary',
                          '& .MuiTableSortLabel-icon': { opacity: activeSortField === col.field ? 1 : 0.3 },
                          '&:hover .MuiTableSortLabel-icon': { opacity: 0.7 },
                        }}
                      >
                        {col.headerName}
                      </TableSortLabel>
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'text.secondary',
                        }}
                      >
                        {col.headerName}
                      </Typography>
                    )}
                  </TableCell>
                );
              })}
              {actions && (
                <TableCell align="right" sx={{ py: 1.5, width: 150 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                    }}
                  >
                    Actions
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                  <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
                    <CircularProgress size={36} thickness={4} />
                    <Typography variant="body2" color="text.secondary">Loading records...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                  <Stack spacing={1} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                        color: 'text.secondary',
                      }}
                    >
                      <InboxOutlined sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 600 }} color="text.secondary">
                      No records found
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Try adjusting your search or filters
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    bgcolor: index % 2 === 1 ? (theme) => alpha(theme.palette.primary.main, 0.015) : 'transparent',
                    transition: 'background-color 120ms ease',
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  {showRowNumbers && (
                    <TableCell sx={{ py: 1.75, width: 56 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.field} sx={{ py: 1.75, fontSize: '0.875rem' }}>
                      {col.render
                        ? col.render(row)
                        : col.type === 'status'
                          ? (
                            <Chip
                              label={row[col.field]}
                              size="small"
                              color={STATUS_COLORS[row[col.field]] || 'default'}
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          )
                          : (
                            <Typography variant="body2" sx={{ fontWeight: isCodeField(col.field) ? 600 : 400, color: isCodeField(col.field) ? 'primary.main' : 'text.primary' }}>
                              {row[col.field] ?? '—'}
                            </Typography>
                          )}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        {onView && (
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => onView(row)}
                              sx={{
                                bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                                '&:hover': { bgcolor: (theme) => alpha(theme.palette.info.main, 0.15) },
                              }}
                            >
                              <VisibilityOutlined sx={{ fontSize: 17 }} color="info" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(row)}
                              sx={{
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) },
                              }}
                            >
                              <EditOutlined sx={{ fontSize: 17 }} color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onResetPassword && (
                          <Tooltip title="Reset password">
                            <IconButton
                              size="small"
                              onClick={() => onResetPassword(row)}
                              sx={{
                                bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08),
                                '&:hover': { bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.15) },
                              }}
                            >
                              <LockResetOutlined sx={{ fontSize: 17 }} color="secondary" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => onDelete(row)}
                              sx={{
                                bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                                '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.15) },
                              }}
                            >
                              <DeleteOutlined sx={{ fontSize: 17 }} color="error" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total !== undefined && (
        <Box
          sx={{
            px: { xs: 1, sm: 2 },
            py: 0.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ pl: 1, fontWeight: 500 }}>
            {total > 0 ? `Showing ${from}–${to} of ${total} records` : 'No records to display'}
          </Typography>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => onPageChange(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Rows:"
            sx={{
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8125rem',
                fontWeight: 500,
              },
              '& .MuiTablePagination-toolbar': { minHeight: 52 },
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default DataTable;
