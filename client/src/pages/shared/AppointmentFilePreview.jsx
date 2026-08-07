import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Stack, CircularProgress, Button, Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBackOutlined, DescriptionOutlined, InsertDriveFileOutlined,
} from '@mui/icons-material';
import mammoth from 'mammoth';
import api from '../../services/api';

const PREVIEW_MODES = {
  PDF: 'pdf',
  IMAGE: 'image',
  DOCX: 'docx',
  TEXT: 'text',
  UNSUPPORTED: 'unsupported',
};

const resolvePreviewMode = (mimeType, fileName) => {
  const mime = (mimeType || '').toLowerCase();
  const ext = (fileName || '').split('.').pop()?.toLowerCase();

  if (mime.includes('pdf') || ext === 'pdf') return PREVIEW_MODES.PDF;
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return PREVIEW_MODES.IMAGE;
  }
  if (
    mime.includes('wordprocessingml')
    || mime.includes('msword')
    || ext === 'docx'
    || ext === 'doc'
  ) {
    return PREVIEW_MODES.DOCX;
  }
  if (mime.startsWith('text/') || ['txt', 'csv'].includes(ext)) return PREVIEW_MODES.TEXT;
  return PREVIEW_MODES.UNSUPPORTED;
};

const AppointmentFilePreview = () => {
  const theme = useTheme();
  const { appointmentId, fileId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    let active = true;
    let blobUrl = '';

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, headers } = await api.get(
          `/appointments/${appointmentId}/files/${fileId}/view`,
          { responseType: 'blob' }
        );

        if (!active) return;

        const mimeType = headers['content-type'] || data.type || '';
        const disposition = headers['content-disposition'] || '';
        const nameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
        const resolvedName = nameMatch
          ? decodeURIComponent(nameMatch[1].replace(/"/g, ''))
          : 'Attachment';
        setFileName(resolvedName);

        const previewMode = resolvePreviewMode(mimeType, resolvedName);
        setMode(previewMode);

        if (previewMode === PREVIEW_MODES.DOCX) {
          const arrayBuffer = await data.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (!active) return;
          setHtml(result.value);
          return;
        }

        if (previewMode === PREVIEW_MODES.TEXT) {
          const body = await data.text();
          if (!active) return;
          setText(body);
          return;
        }

        if (previewMode === PREVIEW_MODES.PDF || previewMode === PREVIEW_MODES.IMAGE) {
          blobUrl = URL.createObjectURL(data);
          if (!active) {
            URL.revokeObjectURL(blobUrl);
            return;
          }
          setObjectUrl(blobUrl);
          return;
        }

        setError('Preview is not available for this file type in the browser.');
      } catch {
        if (active) setError('Unable to load this attachment.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [appointmentId, fileId]);

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const headerSubtitle = useMemo(() => {
    if (loading) return 'Loading attachment preview...';
    if (error) return 'Preview unavailable';
    return 'Document preview';
  }, [loading, error]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 58%, ${theme.palette.primary.light} 100%)`,
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.18)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha('#FFFFFF', 0.15),
              }}
            >
              <DescriptionOutlined />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: '0.08em' }}>
                ATTACHMENT PREVIEW
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                {fileName || headerSubtitle}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<ArrowBackOutlined />}
            onClick={() => window.close()}
            sx={{
              color: 'common.white',
              borderColor: alpha('#FFFFFF', 0.45),
              '&:hover': { borderColor: 'common.white', bgcolor: alpha('#FFFFFF', 0.08) },
            }}
          >
            Close
          </Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
        {loading ? (
          <Stack sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }} spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Opening document...</Typography>
          </Stack>
        ) : error ? (
          <Paper
            elevation={0}
            sx={{
              maxWidth: 720,
              mx: 'auto',
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <InsertDriveFileOutlined sx={{ fontSize: 42, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">{error}</Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              maxWidth: mode === PREVIEW_MODES.IMAGE ? 960 : 920,
              mx: 'auto',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
            }}
          >
            {mode === PREVIEW_MODES.PDF && (
              <Box
                component="iframe"
                title={fileName}
                src={objectUrl}
                sx={{ width: '100%', minHeight: '78vh', border: 0, display: 'block' }}
              />
            )}

            {mode === PREVIEW_MODES.IMAGE && (
              <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <Box
                  component="img"
                  src={objectUrl}
                  alt={fileName}
                  sx={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: 2 }}
                />
              </Box>
            )}

            {mode === PREVIEW_MODES.DOCX && (
              <Box
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  minHeight: '70vh',
                  '& p': { mb: 1.5, lineHeight: 1.7 },
                  '& h1, & h2, & h3': { mt: 2, mb: 1, fontWeight: 700 },
                  '& table': { width: '100%', borderCollapse: 'collapse', my: 2 },
                  '& td, & th': { border: '1px solid', borderColor: 'divider', p: 1 },
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}

            {mode === PREVIEW_MODES.TEXT && (
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: { xs: 2.5, sm: 3 },
                  minHeight: '60vh',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                }}
              >
                {text}
              </Box>
            )}

            {mode === PREVIEW_MODES.UNSUPPORTED && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Preview is not available for this file type in the browser.
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default AppointmentFilePreview;
