import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, Grid, MenuItem,
  Box, Typography, Stack, ToggleButton, ToggleButtonGroup, Button,
  IconButton, Tooltip, Paper, Tabs, Tab, CircularProgress, Divider, Chip, Pagination,
  Autocomplete,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  VideoCallOutlined, HistoryOutlined,
  EventAvailableOutlined, FolderOpenOutlined, AssessmentOutlined, DownloadOutlined,
  PictureAsPdfOutlined, GridOnOutlined, DescriptionOutlined, ArticleOutlined,
  VisibilityOutlined, CloseOutlined, AccessTimeOutlined, PersonOutlined,
  VideocamOutlined, VideocamOffOutlined,
} from '@mui/icons-material';
import DataTable from '../../components/DataTable';
import ConferenceMeetingCard from '../../components/ConferenceMeetingCard';
import ConferenceAttendanceDialog from '../../components/ConferenceAttendanceDialog';
import ConferenceHistoryViewDialog from '../../components/ConferenceHistoryViewDialog';
import FormDialogActions from '../../components/FormDialogActions';
import api from '../../services/api';
import { selectMenuSlotProps } from '../../utils/fieldPlaceholders';
import { handleFormDialogClose } from '../../components/PremiumFormFields';
import { ROLES, CONFERENCE_STATUS } from '../../utils/constants';
import { sortMeetingsByCountdown } from '../../hooks/useCountdown';
import useDocumentDownloadAccess from '../../hooks/useDocumentDownloadAccess';
import useReceptionistPermissions from '../../hooks/useReceptionistPermissions';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { formatCalendarDate, formatClockTime } from '../../utils/dateTime';
import { usePageRefreshRegister } from '../../context/PageRefreshContext';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import useProgressiveTable from '../../hooks/useProgressiveTable';
import PageLoader from '../../components/PageLoader';
import { PdfPreviewFrame, PdfPreviewToolbar, usePdfPreviewControls } from '../../components/PdfPreviewPane';
import mammoth from 'mammoth';

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const resolveDocPreviewMode = (mimeType, fileName, fileType) => {
  const mime = (mimeType || '').toLowerCase();
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  const type = (fileType || '').toLowerCase();
  if (mime.includes('pdf') || ext === 'pdf' || type === 'pdf') return 'pdf';
  if (
    mime.includes('wordprocessingml')
    || mime.includes('msword')
    || ext === 'docx'
    || ext === 'doc'
    || type === 'docx'
  ) return 'docx';
  return 'unsupported';
};

const meetingsSignature = (list) => (list || [])
  .map((m) => `${m.id}:${m.status}:${m.scheduled_date}:${m.scheduled_time}`)
  .join('|');

const SCHEDULE_RANGES = [
  { value: 'today', label: 'Today', possessive: 'Today\'s', empty: 'today' },
  { value: 'tomorrow', label: 'Tomorrow', possessive: 'Tomorrow\'s', empty: 'tomorrow' },
  { value: 'week', label: 'This Week', possessive: 'This Week\'s', empty: 'this week' },
  { value: 'month', label: 'This Month', possessive: 'This Month\'s', empty: 'this month' },
];

const CONFERENCE_TABS = [
  { value: 'upcoming', label: 'Upcoming', icon: EventAvailableOutlined },
  { value: 'history', label: 'History', icon: HistoryOutlined },
  { value: 'documents', label: 'Documents', icon: FolderOpenOutlined },
  { value: 'reports', label: 'Reports', icon: AssessmentOutlined },
];

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', hint: 'Comma separated values', icon: DescriptionOutlined, color: 'info' },
  { value: 'excel', label: 'Excel', hint: 'Microsoft Excel (.xlsx)', icon: GridOnOutlined, color: 'success' },
  { value: 'pdf', label: 'PDF', hint: 'Portable document (.pdf)', icon: PictureAsPdfOutlined, color: 'error' },
  { value: 'word', label: 'Word', hint: 'Microsoft Word (.docx)', icon: ArticleOutlined, color: 'primary' },
];

const CARDS_PER_PAGE = 15;

const PdfDocumentIcon = () => (
  <Box
    aria-hidden
    sx={{
      width: 22,
      height: 28,
      flexShrink: 0,
      position: 'relative',
      borderRadius: '3px 0 3px 3px',
      bgcolor: '#E53935',
      boxShadow: '0 1px 3px rgba(183, 28, 28, 0.35)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      pb: '5px',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        bgcolor: '#FF8A80',
        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        bgcolor: 'background.paper',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
      },
    }}
  >
    <Typography
      component="span"
      sx={{
        color: '#fff',
        fontSize: 7,
        fontWeight: 800,
        letterSpacing: '0.04em',
        lineHeight: 1,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      PDF
    </Typography>
  </Box>
);

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const patientDisplayName = (patient) => (
  patient?.full_name
  || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()
  || '—'
);

const patientOptionLabel = (patient) => {
  const name = patientDisplayName(patient);
  return patient?.patient_code ? `${name} · ${patient.patient_code}` : name;
};

const findExactPatient = (rows, query) => {
  const q = String(query || '').trim().toLowerCase();
  if (!q || !rows?.length) return null;
  const matches = rows.filter((patient) => {
    const name = patientDisplayName(patient).toLowerCase();
    const code = String(patient.patient_code || '').toLowerCase();
    const id = String(patient.id);
    const label = patientOptionLabel(patient).toLowerCase();
    return name === q || code === q || id === q || label === q;
  });
  return matches.length === 1 ? matches[0] : null;
};

const ReportPatientSearch = ({ value, onChange, onQueryChange }) => {
  const [inputValue, setInputValue] = useState(value ? patientDisplayName(value) : '');
  const [options, setOptions] = useState(value ? [value] : []);
  const [loading, setLoading] = useState(false);
  const onChangeRef = useRef(onChange);
  const onQueryChangeRef = useRef(onQueryChange);
  onChangeRef.current = onChange;
  onQueryChangeRef.current = onQueryChange;

  useEffect(() => {
    onQueryChangeRef.current?.(inputValue);
  }, [inputValue]);

  useEffect(() => {
    const query = inputValue.trim();
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (query.length < 1) {
        setOptions(value ? [value] : []);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get('/patients', { params: { search: query, limit: 25 } });
        if (cancelled) return;
        const rows = data.data ?? [];
        const nextOptions = value && !rows.some((row) => String(row.id) === String(value.id))
          ? [value, ...rows]
          : rows;
        setOptions(nextOptions);
        const exact = findExactPatient(rows, query);
        if (exact && String(value?.id) !== String(exact.id)) {
          onChangeRef.current(exact);
          setInputValue(patientDisplayName(exact));
        }
      } catch {
        if (!cancelled) setOptions(value ? [value] : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputValue, value]);

  return (
    <Autocomplete
      fullWidth
      options={options}
      value={value}
      inputValue={inputValue}
      loading={loading}
      autoHighlight
      includeInputInList
      filterOptions={(items) => items}
      noOptionsText={
        loading
          ? 'Searching patients...'
          : (inputValue.trim() ? 'No matching patients' : 'Type a name or patient ID')
      }
      getOptionLabel={(option) => {
        if (!option || typeof option === 'string') return option || '';
        return patientDisplayName(option);
      }}
      isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
      onChange={(_, patient) => {
        onChange(patient || null);
        setInputValue(patient ? patientDisplayName(patient) : '');
      }}
      onInputChange={(_, next, reason) => {
        if (reason === 'reset') return;
        setInputValue(next);
        if (reason === 'clear' || next === '') {
          onChange(null);
          return;
        }
        if (value) {
          const typed = next.trim().toLowerCase();
          const selectedName = patientDisplayName(value).toLowerCase();
          const selectedCode = String(value.patient_code || '').toLowerCase();
          const selectedId = String(value.id);
          if (typed !== selectedName && typed !== selectedCode && typed !== selectedId) {
            onChange(null);
          }
        }
      }}
      renderOption={(props, option) => {
        const { key, ...itemProps } = props;
        return (
          <Box component="li" key={key} {...itemProps}>
            <Box sx={{ py: 0.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {patientDisplayName(option)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.patient_code || `ID ${option.id}`}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label="Patient"
          placeholder="Type name or ID, then pick the patient"
          InputLabelProps={{ shrink: true, ...params.InputLabelProps }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <PersonOutlined sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
                {params.InputProps?.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps?.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

const Conferences = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const canDownloadDocuments = useDocumentDownloadAccess();
  const { can } = useReceptionistPermissions();
  const { formatTime, formatStoredClock } = useSystemDateTime();
  const canViewDocuments = can('documents_view');
  const canExportReports = can('reports_export');
  const availableTabs = useMemo(() => CONFERENCE_TABS.filter((tab) => {
    if (tab.value === 'documents') return canViewDocuments;
    if (tab.value === 'reports') return canExportReports;
    return true;
  }), [canViewDocuments, canExportReports]);
  const isClinical = [ROLES.GP, ROLES.AHP].includes(user?.role);
  const canViewAttendance = [ROLES.RECEPTIONIST, ROLES.ADMIN].includes(user?.role);
  const canPlayRecordings = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
  const canUpdateStatus = isClinical;
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [scheduleRange, setScheduleRange] = useState('today');
  const [schedulePage, setSchedulePage] = useState(1);
  const [loadingToday, setLoadingToday] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [joining, setJoining] = useState(null);
  const [ending, setEnding] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [historyDateScope, setHistoryDateScope] = useState('');
  const [documentsDate, setDocumentsDate] = useState('');
  const [documentsDateScope, setDocumentsDateScope] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = availableTabs.some((t) => t.value === requestedTab) ? requestedTab : 'upcoming';
  const setActiveTab = (value) => setSearchParams({ tab: value }, { replace: true });

  const [sortTick, setSortTick] = useState(() => Date.now());
  const { handleSubmit, reset, control } = useForm();

  const [documentsSearch, setDocumentsSearch] = useState('');

  const [docPreview, setDocPreview] = useState({
    open: false, loading: false, url: '', fileName: '', mode: null, html: '', row: null,
  });
  const previewUrlRef = useRef('');
  const pdfControls = usePdfPreviewControls(
    docPreview.mode === 'pdf' ? docPreview.url : '',
    Boolean(docPreview.open && docPreview.mode === 'pdf' && docPreview.url && !docPreview.loading),
  );
  const [reportFilters, setReportFilters] = useState({ start_date: '', end_date: '', status: '', patient_id: '' });
  const [reportPatient, setReportPatient] = useState(null);
  const [reportPatientQuery, setReportPatientQuery] = useState('');
  const [patientSearchKey, setPatientSearchKey] = useState(0);
  const [exporting, setExporting] = useState(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceConferenceId, setAttendanceConferenceId] = useState(null);
  const [historyViewOpen, setHistoryViewOpen] = useState(false);
  const [historyViewId, setHistoryViewId] = useState(null);

  const openHistoryView = (row) => {
    setHistoryViewId(row.id);
    setHistoryViewOpen(true);
  };

  const openAttendance = (row) => {
    setAttendanceConferenceId(row.id);
    setAttendanceOpen(true);
  };

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
  }, []);

  useEffect(() => () => {
    if (previewUrlRef.current) window.URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const sortedTodayMeetings = useMemo(
    () => sortMeetingsByCountdown(todayMeetings, sortTick),
    [todayMeetings, sortTick]
  );

  const activeRange = useMemo(
    () => SCHEDULE_RANGES.find((r) => r.value === scheduleRange) ?? SCHEDULE_RANGES[0],
    [scheduleRange]
  );

  const scheduleTotalPages = Math.max(1, Math.ceil(sortedTodayMeetings.length / CARDS_PER_PAGE));

  // Keep the current page valid when the meeting list shrinks (status changes,
  // range switch, or a live refresh removing cards).
  useEffect(() => {
    setSchedulePage((prev) => Math.min(prev, scheduleTotalPages));
  }, [scheduleTotalPages]);

  const pagedMeetings = useMemo(() => {
    const start = (schedulePage - 1) * CARDS_PER_PAGE;
    return sortedTodayMeetings.slice(start, start + CARDS_PER_PAGE);
  }, [sortedTodayMeetings, schedulePage]);

  const handleRangeChange = (_event, value) => {
    if (value) {
      setScheduleRange(value);
      setSchedulePage(1);
    }
  };

  const fetchToday = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingToday(true);
    try {
      const { data } = await api.get('/conferences/schedule', {
        params: {
          range: scheduleRange,
          ...(silent ? {} : { _ts: Date.now() }),
        },
        ...(silent ? {} : {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        }),
      });
      const next = (data.data ?? []).filter(
        (m) => !['completed', 'cancelled'].includes(m.status)
      );
      setTodayMeetings((prev) => (
        silent && meetingsSignature(prev) === meetingsSignature(next) ? prev : next
      ));
    } catch {
      if (!silent) toast.error('Failed to load scheduled meetings');
    } finally {
      if (!silent) setLoadingToday(false);
    }
  }, [scheduleRange]);

  const fetchHistory = useCallback(async ({ page: pageNum, limit }) => {
    const { data } = await api.get('/conferences', {
      params: {
        scope: 'history',
        search: search || undefined,
        status: statusFilter || undefined,
        date: historyDateScope ? undefined : (historyDate || undefined),
        date_scope: historyDateScope || undefined,
        page: pageNum,
        limit,
      },
    });
    return { rows: data.data ?? [], total: data.pagination?.total ?? 0 };
  }, [search, statusFilter, historyDate, historyDateScope]);

  const {
    rows, loading, loadingMore, total, page, setPage, rowsPerPage, setRowsPerPage, reload: reloadHistory, error: historyError,
  } = useProgressiveTable(fetchHistory, { enabled: activeTab === 'history' });

  const fetchDocumentsPage = useCallback(async ({ page: pageNum, limit }) => {
    const { data } = await api.get('/conferences/documents', {
      params: {
        search: documentsSearch || undefined,
        date: documentsDateScope ? undefined : (documentsDate || undefined),
        date_scope: documentsDateScope || undefined,
        page: pageNum,
        limit,
      },
    });
    return { rows: data.data ?? [], total: data.pagination?.total ?? 0 };
  }, [documentsSearch, documentsDate, documentsDateScope]);

  const {
    rows: documents,
    loading: documentsLoading,
    loadingMore: documentsLoadingMore,
    total: documentsTotal,
    page: documentsPage,
    setPage: setDocumentsPage,
    rowsPerPage: documentsPerPage,
    setRowsPerPage: setDocumentsPerPage,
    reload: reloadDocuments,
    error: documentsError,
  } = useProgressiveTable(fetchDocumentsPage, { enabled: activeTab === 'documents' });

  useEffect(() => {
    if (historyError) toast.error('Failed to load conferences');
  }, [historyError]);

  useEffect(() => {
    if (documentsError) toast.error('Failed to load conference documents');
  }, [documentsError]);

  const refreshAll = useCallback(() => {
    fetchToday({ silent: true });
    if (activeTab === 'history') reloadHistory();
  }, [fetchToday, reloadHistory, activeTab]);

  const refreshPage = useCallback(async () => {
    if (activeTab === 'upcoming') {
      await fetchToday();
    } else if (activeTab === 'history') {
      await reloadHistory();
    } else if (activeTab === 'documents') {
      await reloadDocuments();
    }
  }, [activeTab, fetchToday, reloadHistory, reloadDocuments]);

  usePageRefreshRegister(refreshPage);
  useLiveRefresh('schedule:refresh', () => {
    fetchToday({ silent: true });
    if (activeTab === 'history') reloadHistory();
  });

  // Keep the tab in the URL so sidebar sub-menu links stay highlighted.
  useEffect(() => {
    if (requestedTab !== activeTab) setSearchParams({ tab: activeTab }, { replace: true });
  }, [requestedTab, activeTab, setSearchParams]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  useEffect(() => {
    if (activeTab !== 'upcoming') return undefined;
    const poll = setInterval(() => fetchToday({ silent: true }), 30000);
    return () => clearInterval(poll);
  }, [fetchToday, activeTab]);

  useEffect(() => {
    if (activeTab !== 'upcoming') return undefined;
    const timer = setInterval(() => setSortTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const handleOpen = (row) => {
    setEditRow(row);
    reset({ status: row.status });
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditRow(null);
    reset({ status: 'scheduled' });
  };

  const onSubmit = async (formData) => {
    if (!editRow) return;
    setSubmitting(true);
    try {
      await api.put(`/conferences/${editRow.id}`, formData);
      toast.success('Conference updated successfully');
      handleCloseForm();
      refreshAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSubmitting(false); }
  };

  const closeDocPreview = useCallback(() => {
    revokePreviewUrl();
    setDocPreview({ open: false, loading: false, url: '', fileName: '', mode: null, html: '', row: null });
  }, [revokePreviewUrl]);

  const openDocument = useCallback(async (row, { download = false } = {}) => {
    if (download && !canDownloadDocuments) {
      toast.error('Document download is not allowed for your role');
      return;
    }

    if (download) {
      try {
        const { data } = await api.get(
          `/conferences/${row.conference_id}/documents/${row.file_id}/view`,
          { params: { download: 1 }, responseType: 'blob' }
        );
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${row.document_code || 'document'}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch {
        toast.error('Failed to download document');
      }
      return;
    }

    revokePreviewUrl();
    setDocPreview({
      open: true,
      loading: true,
      url: '',
      fileName: row.document_code || 'Document',
      mode: null,
      html: '',
      row,
    });

    try {
      const { data, headers } = await api.get(
        `/conferences/${row.conference_id}/documents/${row.file_id}/view`,
        {
          responseType: 'blob',
          headers: { Accept: 'application/pdf,application/octet-stream' },
        }
      );
      const headerMime = String(headers['content-type'] || data.type || '').toLowerCase();
      const signature = await data.slice(0, 8).text();
      const isPdf = signature.startsWith('%PDF');
      const isJson = headerMime.includes('json') || signature.trim().startsWith('{');

      if (isJson || data.size < 8) {
        throw new Error('Document is not available');
      }

      const fileName = row.document_code || 'Document';

      if (isPdf) {
        const pdfBlob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        previewUrlRef.current = url;
        setDocPreview({
          open: true,
          loading: false,
          url,
          fileName,
          mode: 'pdf',
          html: '',
          row,
        });
        return;
      }

      const mode = resolveDocPreviewMode(headerMime, fileName, row.mime_type);

      if (mode === 'docx') {
        const arrayBuffer = await data.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocPreview({
          open: true,
          loading: false,
          url: '',
          fileName,
          mode: 'docx',
          html: result.value,
          row,
        });
        return;
      }

      setDocPreview({
        open: true,
        loading: false,
        url: '',
        fileName,
        mode: 'unsupported',
        html: '',
        row,
      });
    } catch {
      toast.error('Failed to open document');
      closeDocPreview();
    }
  }, [canDownloadDocuments, revokePreviewUrl, closeDocPreview]);

  const handleExport = async (format) => {
    let patientId = reportPatient?.id || reportFilters.patient_id || '';
    const typed = reportPatientQuery.trim();

    if (typed && !patientId) {
      try {
        const { data } = await api.get('/patients', { params: { search: typed, limit: 25 } });
        const exact = findExactPatient(data.data ?? [], typed);
        if (!exact) {
          toast.error('Pick a patient from the list, or type the full name or ID exactly');
          return;
        }
        patientId = exact.id;
        setReportPatient(exact);
        setReportFilters((f) => ({ ...f, patient_id: String(exact.id) }));
      } catch {
        toast.error('Could not verify the patient. Pick a name from the list.');
        return;
      }
    }

    setExporting(format);
    try {
      const { data } = await api.get('/conferences/export', {
        params: {
          format,
          status: reportFilters.status || undefined,
          start_date: reportFilters.start_date || undefined,
          end_date: reportFilters.end_date || undefined,
          patient_id: patientId || undefined,
        },
        responseType: 'blob',
      });

      const extension = { csv: 'csv', excel: 'xlsx', pdf: 'pdf', word: 'docx' }[format];
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conference-report-${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setExporting(null);
    }
  };

  const documentColumns = useMemo(() => [
    {
      field: 'document_code',
      headerName: 'Document',
      render: (r) => (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <PdfDocumentIcon />
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-0.01em' }} noWrap>
            {r.document_code || '—'}
          </Typography>
        </Stack>
      ),
    },
    { field: 'conference_code', headerName: 'Conference ID' },
    { field: 'patient_name', headerName: 'Patient' },
    { field: 'scheduled_date', headerName: 'Date', render: (r) => formatCalendarDate(r.scheduled_date) },
    {
      field: 'scheduled_time',
      headerName: 'Time',
      render: (r) => formatClockTime(r.scheduled_time),
    },
    { field: 'file_size', headerName: 'Size', render: (r) => formatFileSize(r.file_size) },
    {
      field: 'actions',
      headerName: 'File',
      sortable: false,
      render: (r) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View document">
            <IconButton
              size="small"
              onClick={() => openDocument(r)}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) },
              }}
            >
              <VisibilityOutlined sx={{ fontSize: 17 }} color="primary" />
            </IconButton>
          </Tooltip>
          {canDownloadDocuments && (
            <Tooltip title="Download">
              <IconButton
                size="small"
                onClick={() => openDocument(r, { download: true })}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                  '&:hover': { bgcolor: (theme) => alpha(theme.palette.success.main, 0.15) },
                }}
              >
                <DownloadOutlined sx={{ fontSize: 17 }} color="success" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ], [canDownloadDocuments, openDocument]);

  const columns = useMemo(() => [
    { field: 'conference_code', headerName: 'Conference ID' },
    { field: 'patient_name', headerName: 'Patient' },
    { field: 'scheduled_date', headerName: 'Date', render: (r) => formatCalendarDate(r.scheduled_date) },
    {
      field: 'started_time',
      headerName: 'Start Time',
      render: (r) => (r.accepted_at
        ? formatTime(r.accepted_at)
        : formatStoredClock(r.started_time, r.scheduled_date)),
    },
    {
      field: 'ended_time',
      headerName: 'End Time',
      render: (r) => (r.ended_at
        ? formatTime(r.ended_at)
        : formatStoredClock(r.ended_time, r.scheduled_date)),
    },
    { field: 'assigned_by_name', headerName: 'Assigned By', render: (r) => r.assigned_by_name || '—' },
    { field: 'status', headerName: 'Status', type: 'status' },
  ], [formatTime, formatStoredClock]);

  const renderHistoryLeadingActions = (r) => {
    const recorded = r.recording_status === 'ready';
    const showRecording = ['completed', 'cancelled'].includes(r.status);
    return (
      <>
        {showRecording && (
          <Tooltip title={recorded ? (canPlayRecordings ? 'Recorded — play video' : 'Recorded') : 'Not recorded'}>
            <span>
              <IconButton
                size="small"
                disabled={!recorded}
                onClick={recorded && canPlayRecordings ? () => navigate(`/videos?recording=${r.recording_id}`) : undefined}
                sx={{
                  bgcolor: (theme) => alpha(recorded ? theme.palette.success.main : theme.palette.action.disabled, recorded ? 0.1 : 0.08),
                  '&:hover': { bgcolor: (theme) => alpha(theme.palette.success.main, 0.18) },
                }}
              >
                {recorded
                  ? <VideocamOutlined sx={{ fontSize: 17 }} color="success" />
                  : <VideocamOffOutlined sx={{ fontSize: 17 }} color="disabled" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
        {canViewAttendance && r.status === 'cancelled' && (
          <Tooltip title="No join times (cancelled)">
            <span>
              <IconButton
                size="small"
                disabled
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.action.disabled, 0.08),
                }}
              >
                <AccessTimeOutlined sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {canViewAttendance && r.status === 'completed' && (
          <Tooltip title="View participant join times (salary basis)">
            <IconButton
              size="small"
              onClick={() => openAttendance(r)}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.warning.main, 0.18) },
              }}
            >
              <AccessTimeOutlined sx={{ fontSize: 17 }} color="warning" />
            </IconButton>
          </Tooltip>
        )}
      </>
    );
  };

  const dateScopeOptions = [
    { value: '', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  const conferenceFilters = [
    {
      key: 'history_date',
      label: 'Select date',
      type: 'date',
      value: historyDate,
      onChange: (v) => { setHistoryDate(v); if (v) setHistoryDateScope(''); setPage(0); },
    },
    {
      key: 'history_date_scope',
      label: 'Date',
      value: historyDateScope,
      onChange: (v) => { setHistoryDateScope(v); if (v) setHistoryDate(''); setPage(0); },
      options: dateScopeOptions,
    },
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (v) => { setStatusFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ];

  const documentFilters = [
    {
      key: 'documents_date',
      label: 'Select date',
      type: 'date',
      value: documentsDate,
      onChange: (v) => { setDocumentsDate(v); if (v) setDocumentsDateScope(''); setDocumentsPage(0); },
    },
    {
      key: 'documents_date_scope',
      label: 'Date',
      value: documentsDateScope,
      onChange: (v) => { setDocumentsDateScope(v); if (v) setDocumentsDate(''); setDocumentsPage(0); },
      options: dateScopeOptions,
    },
  ];

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Conference sections"
          sx={{
            px: 1,
            minHeight: 54,
            '& .MuiTab-root': {
              minHeight: 54,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              gap: 0.75,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main', fontWeight: 700 },
            },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          {availableTabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={<tab.icon sx={{ fontSize: 19 }} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ display: activeTab === 'upcoming' ? 'block' : 'none' }} mb={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <VideoCallOutlined color="primary" />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {isClinical
                  ? `${activeRange.possessive} Meetings`
                  : `${activeRange.possessive} Conference Schedule`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sorted by nearest meeting first — order updates live
              </Typography>
            </Box>
          </Stack>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={scheduleRange}
            onChange={handleRangeChange}
            aria-label="Conference schedule range"
            sx={{
              flexWrap: 'nowrap',
              bgcolor: 'background.paper',
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.75,
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                borderColor: 'divider',
              },
            }}
          >
            {SCHEDULE_RANGES.map((range) => (
              <ToggleButton key={range.value} value={range.value}>
                {range.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {loadingToday ? (
          <PageLoader message="Loading scheduled meetings..." />
        ) : todayMeetings.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography color="text.secondary">
              No meetings scheduled for {activeRange.empty}.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(5, 1fr)',
              },
              gap: { xs: 1.5, xl: 1.25 },
            }}
          >
            {pagedMeetings.map((meeting, index) => (
              <ConferenceMeetingCard
                key={meeting.id}
                conference={meeting}
                userRole={user?.role}
                onRefresh={refreshAll}
                accepting={accepting}
                joining={joining}
                ending={ending}
                setAccepting={setAccepting}
                setJoining={setJoining}
                setEnding={setEnding}
                isNextUp={schedulePage === 1 && index === 0}
              />
            ))}
          </Box>
        )}

        {!loadingToday && sortedTodayMeetings.length > 0 && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              mt: 2.5,
              px: { xs: 1.5, sm: 2 },
              py: 1,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {`Showing ${(schedulePage - 1) * CARDS_PER_PAGE + 1}–`
                + `${Math.min(schedulePage * CARDS_PER_PAGE, sortedTodayMeetings.length)}`
                + ` of ${sortedTodayMeetings.length} meetings`}
            </Typography>
            {scheduleTotalPages > 1 && (
              <Pagination
                color="primary"
                shape="rounded"
                size="small"
                count={scheduleTotalPages}
                page={schedulePage}
                onChange={(_event, value) => setSchedulePage(value)}
                aria-label="Conference schedule pages"
                sx={{ '& .MuiPaginationItem-root': { fontWeight: 600 } }}
              />
            )}
          </Stack>
        )}
      </Box>

      {activeTab === 'history' && (
        <DataTable
          title={isClinical ? 'All My Conferences' : 'Conference History'}
          columns={columns}
          rows={rows}
          loading={loading}
          loadingMore={loadingMore}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
          onSearch={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Search by conference ID, patient, or assigned by..."
          filters={conferenceFilters}
          renderLeadingActions={renderHistoryLeadingActions}
          onView={openHistoryView}
          onEdit={canUpdateStatus ? handleOpen : undefined}
          actions
        />
      )}

      {activeTab === 'documents' && (
        <DataTable
          title="Conference Documents"
          columns={documentColumns}
          rows={documents}
          loading={documentsLoading}
          loadingMore={documentsLoadingMore}
          total={documentsTotal}
          page={documentsPage}
          rowsPerPage={documentsPerPage}
          onPageChange={setDocumentsPage}
          onRowsPerPageChange={(v) => { setDocumentsPerPage(v); setDocumentsPage(0); }}
          onSearch={(v) => { setDocumentsSearch(v); setDocumentsPage(0); }}
          searchPlaceholder="Search by document ID, conference ID, or patient..."
          filters={documentFilters}
          actions={false}
          defaultSortField="scheduled_date"
          defaultSortOrder="desc"
        />
      )}

      {activeTab === 'reports' && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                }}
              >
                <AssessmentOutlined sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Conference Meeting Reports
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Filter the meetings you need, then export in your preferred format
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontSize: '0.6875rem',
              }}
            >
              Filters
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="From date"
                  value={reportFilters.start_date}
                  onChange={(e) => setReportFilters((f) => ({ ...f, start_date: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="To date"
                  value={reportFilters.end_date}
                  onChange={(e) => setReportFilters((f) => ({ ...f, end_date: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ReportPatientSearch
                  key={patientSearchKey}
                  value={reportPatient}
                  onChange={(patient) => {
                    setReportPatient(patient);
                    setReportFilters((f) => ({ ...f, patient_id: patient ? String(patient.id) : '' }));
                  }}
                  onQueryChange={setReportPatientQuery}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Status"
                  value={reportFilters.status}
                  onChange={(e) => setReportFilters((f) => ({ ...f, status: e.target.value }))}
                  slotProps={{
                    inputLabel: { shrink: true },
                    select: { MenuProps: selectMenuSlotProps },
                  }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {CONFERENCE_STATUS.map((s) => (
                    <MenuItem key={s} value={s}>{formatLabel(s)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', mb: 2, justifyContent: 'space-between' }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  fontSize: '0.6875rem',
                }}
              >
                Export Format
              </Typography>
              {(reportFilters.start_date || reportFilters.end_date || reportFilters.status || reportFilters.patient_id) && (
                <Chip
                  size="small"
                  label="Filters applied"
                  color="primary"
                  variant="outlined"
                  onDelete={() => {
                    setReportPatient(null);
                    setReportPatientQuery('');
                    setPatientSearchKey((key) => key + 1);
                    setReportFilters({ start_date: '', end_date: '', status: '', patient_id: '' });
                  }}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>

            <Grid container spacing={2}>
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                const busy = exporting === format.value;
                return (
                  <Grid key={format.value} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box
                      role="button"
                      tabIndex={0}
                      aria-label={`Download ${format.label} report`}
                      onClick={() => !exporting && handleExport(format.value)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !exporting) {
                          e.preventDefault();
                          handleExport(format.value);
                        }
                      }}
                      sx={{
                        height: '100%',
                        p: 2.25,
                        borderRadius: 2.5,
                        textAlign: 'center',
                        cursor: exporting ? 'default' : 'pointer',
                        opacity: exporting && !busy ? 0.55 : 1,
                        border: '1.5px solid',
                        borderColor: (theme) => alpha(theme.palette[format.color].main, 0.25),
                        bgcolor: 'background.paper',
                        transition: 'all 160ms ease',
                        '&:hover': exporting ? {} : {
                          borderColor: (theme) => theme.palette[format.color].main,
                          bgcolor: (theme) => alpha(theme.palette[format.color].main, 0.05),
                          transform: 'translateY(-2px)',
                          boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette[format.color].main, 0.18)}`,
                        },
                        '&:focus-visible': {
                          outline: (theme) => `2px solid ${theme.palette[format.color].main}`,
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          mx: 'auto',
                          mb: 1.25,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: (theme) => alpha(theme.palette[format.color].main, 0.1),
                          color: `${format.color}.main`,
                        }}
                      >
                        {busy
                          ? <CircularProgress size={20} color={format.color} />
                          : <Icon sx={{ fontSize: 23 }} />}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                        {busy ? 'Preparing…' : format.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format.hint}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            <Stack direction="row" spacing={1} sx={{ mt: 3, alignItems: 'center' }}>
              <DownloadOutlined sx={{ fontSize: 17, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                Reports include conference ID, patient, GP, AHP, date, time, and status.
              </Typography>
            </Stack>
          </Box>
        </Paper>
      )}

      <Dialog
        open={docPreview.open}
        onClose={closeDocPreview}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.22)',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            color: 'common.white',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.light} 100%)`,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha('#FFFFFF', 0.15),
              }}
            >
              {docPreview.mode === 'pdf' ? (
                <PictureAsPdfOutlined sx={{ fontSize: 20 }} />
              ) : (
                <DescriptionOutlined sx={{ fontSize: 20 }} />
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: '0.08em' }}>
                DOCUMENT PREVIEW
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                {docPreview.fileName}
              </Typography>
            </Box>
            {docPreview.mode === 'pdf' && docPreview.url && !docPreview.loading && (
              <PdfPreviewToolbar
                page={pdfControls.page}
                pageCount={pdfControls.pageCount}
                zoom={pdfControls.zoom}
                onPageChange={pdfControls.setPage}
                onZoomChange={pdfControls.setZoom}
                onOpenTab={() => window.open(docPreview.url, '_blank', 'noopener,noreferrer')}
              />
            )}
            {docPreview.row && canDownloadDocuments && (
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={() => openDocument(docPreview.row, { download: true })}
                  sx={{
                    color: 'common.white',
                    bgcolor: alpha('#FFFFFF', 0.12),
                    '&:hover': { bgcolor: alpha('#FFFFFF', 0.22) },
                  }}
                >
                  <DownloadOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Close preview">
              <IconButton
                size="small"
                onClick={closeDocPreview}
                sx={{
                  color: 'common.white',
                  bgcolor: alpha('#FFFFFF', 0.12),
                  '&:hover': { bgcolor: alpha('#FFFFFF', 0.22) },
                }}
              >
                <CloseOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: 'grey.200' }}>
          {docPreview.loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 14 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
                Opening document…
              </Typography>
            </Stack>
          ) : docPreview.mode === 'pdf' ? (
            <PdfPreviewFrame
              url={docPreview.url}
              fileName={docPreview.fileName}
              page={pdfControls.page}
              zoom={pdfControls.zoom}
            />
          ) : docPreview.mode === 'docx' ? (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxHeight: { xs: '60vh', md: '72vh' }, overflow: 'auto' }}>
              <Paper
                elevation={0}
                sx={{
                  maxWidth: 820,
                  mx: 'auto',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  border: '1px solid',
                  borderColor: alpha('#FFFFFF', 0.08),
                }}
              >
                <Box
                  sx={{
                    p: { xs: 3, sm: 5 },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    fontFamily: '"Segoe UI", system-ui, sans-serif',
                    '& p': { mb: 1.5, lineHeight: 1.75, fontSize: '0.9375rem' },
                    '& h1': {
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'primary.dark',
                      mb: 0.5,
                      letterSpacing: '-0.02em',
                    },
                    '& h2, & h3': { mt: 2.5, mb: 1, fontWeight: 700, color: 'primary.main' },
                    '& strong': { fontWeight: 700, color: 'text.primary' },
                    '& table': {
                      width: '100%',
                      borderCollapse: 'collapse',
                      my: 2.5,
                      fontSize: '0.875rem',
                    },
                    '& td, & th': {
                      border: '1px solid',
                      borderColor: alpha('#64748B', 0.25),
                      p: 1.25,
                      verticalAlign: 'top',
                    },
                    '& th': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                      fontWeight: 700,
                      width: '32%',
                      color: 'text.secondary',
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: docPreview.html }}
                />
              </Paper>
            </Box>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 10, px: 3 }}>
              <DescriptionOutlined sx={{ fontSize: 52, color: 'grey.400', mb: 2 }} />
              <Typography variant="body1" sx={{ color: 'grey.200', fontWeight: 600 }}>
                Preview is not available for this file type
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.400', mt: 0.5, mb: 2.5, textAlign: 'center' }}>
                {canDownloadDocuments
                  ? 'Download the file to open it in another application.'
                  : 'Preview is not available for this file type. Contact your administrator if you need a copy.'}
              </Typography>
              {docPreview.row && canDownloadDocuments && (
                <Button
                  variant="contained"
                  startIcon={<DownloadOutlined />}
                  onClick={() => openDocument(docPreview.row, { download: true })}
                >
                  Download file
                </Button>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onClose={handleFormDialogClose(handleCloseForm, submitting)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Conference Status</DialogTitle>
        <form key={editRow?.id ?? 'new'} onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              {editRow && (
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        select
                        label="Status"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        slotProps={{ select: { MenuProps: selectMenuSlotProps } }}
                      >
                        {CONFERENCE_STATUS.map((s) => <MenuItem key={s} value={s}>{formatLabel(s)}</MenuItem>)}
                      </TextField>
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <FormDialogActions
            onCancel={handleCloseForm}
            submitLabel="Update Status"
            loading={submitting}
          />
        </form>
      </Dialog>

      <ConferenceHistoryViewDialog
        open={historyViewOpen}
        conferenceId={historyViewId}
        onClose={() => {
          setHistoryViewOpen(false);
          setHistoryViewId(null);
        }}
      />
      <ConferenceAttendanceDialog
        open={attendanceOpen}
        conferenceId={attendanceConferenceId}
        onClose={() => {
          setAttendanceOpen(false);
          setAttendanceConferenceId(null);
        }}
      />
    </>
  );
};

export default Conferences;
