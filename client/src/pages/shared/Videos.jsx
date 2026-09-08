import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, Chip, IconButton, Tooltip, Stack, Box,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  VideocamOutlined, PlayArrowOutlined, DownloadOutlined, CloseOutlined,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/DataTable';
import { PremiumDialogHeader, dialogPaperSx, dialogContentSx } from '../../components/PremiumFormFields';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { usePageRefreshRegister } from '../../context/PageRefreshContext';
import useProgressiveTable from '../../hooks/useProgressiveTable';
import PageLoader from '../../components/PageLoader';

const STATUS_COLOR = {
  ready: 'success',
  recording: 'warning',
  requested: 'info',
  not_recorded: 'default',
  failed: 'error',
};

const formatBytes = (value) => {
  const size = Number(value) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatStatus = (value) => String(value || '—').replace(/_/g, ' ');

const Videos = () => {
  const { formatDate, formatTime, formatStoredClock } = useSystemDateTime();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [playing, setPlaying] = useState(null);
  const [playUrl, setPlayUrl] = useState('');
  const [playLoading, setPlayLoading] = useState(false);

  const fetcher = useCallback(async ({ page, limit }) => {
    const { data } = await api.get('/recordings', {
      params: { page, limit, search, status: statusFilter },
    });
    return { rows: data.data || [], total: data.pagination?.total || 0 };
  }, [search, statusFilter]);

  const {
    rows, loading, loadingMore, total, page, setPage, rowsPerPage, setRowsPerPage, reload,
  } = useProgressiveTable(fetcher);

  usePageRefreshRegister(reload);

  const openPlayer = useCallback(async (row) => {
    if (!row?.id || row.status !== 'ready') return;
    setPlaying(row);
    setPlayLoading(true);
    setPlayUrl('');
    try {
      const { data } = await api.get(`/recordings/${row.id}/stream`, { responseType: 'blob' });
      setPlayUrl(URL.createObjectURL(data));
    } catch {
      toast.error('Failed to load recording');
      setPlaying(null);
    } finally {
      setPlayLoading(false);
    }
  }, []);

  const closePlayer = useCallback(() => {
    setPlaying(null);
    setPlayUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    if (searchParams.get('recording')) {
      searchParams.delete('recording');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const recordingId = Number(searchParams.get('recording'));
    if (!recordingId || playing?.id === recordingId) return undefined;
    let cancelled = false;
    api.get(`/recordings/${recordingId}`).then(({ data }) => {
      if (!cancelled && data.data) openPlayer(data.data);
    }).catch(() => {
      if (!cancelled) toast.error('Recording not found');
    });
    return () => { cancelled = true; };
  }, [searchParams, playing?.id, openPlayer]);

  const downloadRecording = async (row) => {
    try {
      const { data } = await api.get(`/recordings/${row.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = row.original_name || row.stored_name || `recording-${row.id}.webm`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download recording');
    }
  };

  const columns = useMemo(() => [
    { field: 'conference_code', headerName: 'Conference ID' },
    { field: 'patient_name', headerName: 'Patient' },
    {
      field: 'scheduled_date',
      headerName: 'Meeting date',
      render: (row) => formatDate(row.scheduled_date),
    },
    {
      field: 'scheduled_time',
      headerName: 'Time',
      render: (row) => formatStoredClock(row.scheduled_time, row.scheduled_date),
    },
    {
      field: 'status',
      headerName: 'Recording',
      render: (row) => (
        <Chip size="small" color={STATUS_COLOR[row.status] || 'default'} label={formatStatus(row.status)} />
      ),
    },
    {
      field: 'file_size',
      headerName: 'Size',
      render: (row) => (row.status === 'ready' ? formatBytes(row.file_size) : '—'),
    },
    {
      field: 'created_at',
      headerName: 'Saved',
      render: (row) => (row.ended_at || row.created_at
        ? `${formatDate(row.ended_at || row.created_at)} ${formatTime(row.ended_at || row.created_at)}`
        : '—'),
    },
  ], [formatDate, formatTime, formatStoredClock]);

  const renderLeadingActions = (row) => (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title={row.status === 'ready' ? 'Play recording' : 'Not available'}>
        <span>
          <IconButton
            size="small"
            disabled={row.status !== 'ready'}
            onClick={() => openPlayer(row)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
              '&:hover': { bgcolor: (theme) => alpha(theme.palette.success.main, 0.18) },
            }}
          >
            <PlayArrowOutlined sx={{ fontSize: 18 }} color={row.status === 'ready' ? 'success' : 'disabled'} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={row.status === 'ready' ? 'Download' : 'Not available'}>
        <span>
          <IconButton
            size="small"
            disabled={row.status !== 'ready'}
            onClick={() => downloadRecording(row)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              '&:hover': { bgcolor: (theme) => alpha(theme.palette.info.main, 0.18) },
            }}
          >
            <DownloadOutlined sx={{ fontSize: 18 }} color={row.status === 'ready' ? 'info' : 'disabled'} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );

  if (loading && !rows.length) return <PageLoader />;

  return (
    <>
      <DataTable
        title="Meeting Videos"
        columns={columns}
        rows={rows}
        loading={loading}
        loadingMore={loadingMore}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(0); }}
        onSearch={(value) => { setSearch(value); setPage(0); }}
        searchPlaceholder="Search by conference ID or patient..."
        renderLeadingActions={renderLeadingActions}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: (value) => { setStatusFilter(value); setPage(0); },
            options: [
              { value: '', label: 'All' },
              { value: 'ready', label: 'Recorded' },
              { value: 'recording', label: 'Recording' },
              { value: 'not_recorded', label: 'Not recorded' },
              { value: 'failed', label: 'Failed' },
            ],
          },
        ]}
        actions
      />

      <Dialog
        open={Boolean(playing)}
        onClose={closePlayer}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <PremiumDialogHeader
          icon={VideocamOutlined}
          title={playing?.conference_code || 'Recording'}
          subtitle={playing?.patient_name || 'Meeting recording'}
        />
        <DialogContent dividers sx={dialogContentSx}>
          <Box
            sx={{
              bgcolor: '#0f172a',
              borderRadius: 2,
              overflow: 'hidden',
              minHeight: 280,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {playLoading && !playUrl ? (
              <CircularProgress sx={{ color: 'common.white', my: 8 }} />
            ) : playUrl ? (
              <video src={playUrl} controls autoPlay style={{ width: '100%', maxHeight: 480, display: 'block' }}>
                <track kind="captions" />
              </video>
            ) : (
              <Box sx={{ color: 'common.white', py: 6 }}>Unable to play this recording</Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button startIcon={<DownloadOutlined />} onClick={() => playing && downloadRecording(playing)} disabled={playing?.status !== 'ready'}>
            Download
          </Button>
          <Button startIcon={<CloseOutlined />} onClick={closePlayer} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Videos;
