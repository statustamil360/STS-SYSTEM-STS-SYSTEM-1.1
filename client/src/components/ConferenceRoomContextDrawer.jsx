import { useEffect } from 'react';
import {
  Box, IconButton, Stack, Typography, Button, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CloseOutlined, DescriptionOutlined, InsertDriveFileOutlined, OpenInNewOutlined,
  PictureAsPdf, Article, TableChart, ImageOutlined, SlideshowOutlined, NotesOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

export const ROOM_PANELS = {
  patientRecords: {
    title: 'Patient Previous Records',
    empty: 'No previous records were added for this patient.',
  },
  files: {
    title: 'Attach Files',
    empty: 'No files are attached to this conference.',
  },
  previous: {
    title: 'Previous Records',
    empty: 'No previous records (text) were added for this patient.',
  },
  internal: {
    title: 'Internal Notes',
    empty: 'No internal notes were added for this conference.',
  },
  conferenceNote: {
    title: 'Conference Note',
    empty: 'No conference note was added for this meeting.',
  },
};

const openBlob = async (url) => {
  const { data, headers } = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([data], { type: headers['content-type'] || data.type });
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener');
};

const fileVisual = (name = '', mime = '') => {
  const ext = String(name).split('.').pop()?.toLowerCase() || '';
  const type = String(mime).toLowerCase();
  if (ext === 'pdf' || type.includes('pdf')) {
    return { Icon: PictureAsPdf, color: '#DC2626', bg: '#FEE2E2' };
  }
  if (['doc', 'docx'].includes(ext) || type.includes('word')) {
    return { Icon: Article, color: '#2563EB', bg: '#DBEAFE' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || type.includes('excel') || type.includes('spreadsheet')) {
    return { Icon: TableChart, color: '#059669', bg: '#D1FAE5' };
  }
  if (['ppt', 'pptx'].includes(ext) || type.includes('presentation')) {
    return { Icon: SlideshowOutlined, color: '#D97706', bg: '#FEF3C7' };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || type.startsWith('image/')) {
    return { Icon: ImageOutlined, color: '#7C3AED', bg: '#EDE9FE' };
  }
  return { Icon: InsertDriveFileOutlined, color: '#0D9488', bg: '#CCFBF1' };
};

const RecordField = ({ label, icon: Icon, value, empty }) => {
  const text = String(value || '').trim();
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 0.75,
          fontWeight: 700,
          color: 'primary.main',
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25,
          px: 1.75,
          py: 1.5,
          minHeight: 96,
          borderRadius: '22px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main',
            flexShrink: 0,
            mt: 0.15,
          }}
        >
          <Icon sx={{ fontSize: 16 }} />
        </Box>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            color: text ? 'text.primary' : 'text.secondary',
            pt: 0.35,
          }}
        >
          {text || empty}
        </Typography>
      </Box>
    </Box>
  );
};

const FileRow = ({ name, meta, mimeType, onOpen }) => {
  const visual = fileVisual(name, mimeType);
  const FileIcon = visual.Icon;
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'center',
        p: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: visual.bg,
          color: visual.color,
          flexShrink: 0,
        }}
      >
        <FileIcon sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
          {name}
        </Typography>
        {meta && (
          <Typography variant="caption" color="text.secondary">
            {meta}
          </Typography>
        )}
      </Box>
      <Button
        size="small"
        variant="outlined"
        endIcon={<OpenInNewOutlined sx={{ fontSize: 16 }} />}
        onClick={onOpen}
        sx={{ flexShrink: 0, textTransform: 'none', fontWeight: 700 }}
      >
        Open
      </Button>
    </Stack>
  );
};

const ConferenceRoomContextDrawer = ({
  open,
  panel,
  onClose,
  conferenceId,
  context,
  loading,
  anchor,
}) => {
  const meta = ROOM_PANELS[panel] || ROOM_PANELS.patientRecords;

  const handleOpenFile = async (fileId) => {
    try {
      await openBlob(`/conferences/${conferenceId}/files/${fileId}/view`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to open file');
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (event.target.closest?.('[data-room-context-panel]')) return;
      if (event.target.closest?.('[data-room-tool]')) return;
      onClose();
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open, onClose]);

  const renderBody = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      );
    }

    if (panel === 'patientRecords') {
      return (
        <Stack spacing={2}>
          <RecordField
            label="Previous Records (Text)"
            icon={DescriptionOutlined}
            value={context?.patient_previous_records}
            empty={meta.empty}
          />
          {String(context?.medical_history || '').trim() && (
            <RecordField
              label="Medical history"
              icon={DescriptionOutlined}
              value={context.medical_history}
              empty=""
            />
          )}
        </Stack>
      );
    }

    if (panel === 'previous') {
      return (
        <RecordField
          label="Previous Records (Text)"
          icon={DescriptionOutlined}
          value={context?.patient_previous_records}
          empty={meta.empty}
        />
      );
    }

    if (panel === 'internal') {
      return (
        <RecordField
          label="Internal Notes"
          icon={NotesOutlined}
          value={context?.internal_notes}
          empty={meta.empty}
        />
      );
    }

    if (panel === 'conferenceNote') {
      return (
        <RecordField
          label="Conference Note"
          icon={NotesOutlined}
          value={context?.conference_note || context?.conference_notes}
          empty={meta.empty}
        />
      );
    }

    if (panel === 'files') {
      const files = context?.files || [];
      if (!files.length) {
        return (
          <Typography variant="body2" color="text.secondary">
            {meta.empty}
          </Typography>
        );
      }
      return (
        <Stack spacing={1}>
          {files.map((file) => (
            <FileRow
              key={file.id}
              name={file.original_name}
              mimeType={file.mime_type}
              meta={file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Attached file'}
              onOpen={() => handleOpenFile(file.id)}
            />
          ))}
        </Stack>
      );
    }

    return null;
  };

  if (!open || !panel) return null;

  return (
    <Box
      data-room-context-panel
      sx={{
        position: 'fixed',
        top: anchor?.top ?? 96,
        left: anchor?.left ?? 'auto',
        right: anchor?.left == null ? 24 : 'auto',
        width: anchor?.width ?? { xs: 'calc(100% - 32px)', sm: 420 },
        height: anchor?.height || 320,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 18px 48px rgba(15, 23, 42, 0.18)',
      }}
    >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            px: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.25,
              display: 'grid',
              placeItems: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <DescriptionOutlined sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, flex: 1 }} noWrap>
            {meta.title}
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Stack>
        <Box sx={{ px: 2, py: 1.75, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {renderBody()}
        </Box>
    </Box>
  );
};

export default ConferenceRoomContextDrawer;
