import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Stack } from '@mui/material';
import { DownloadOutlined, ArrowBackOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useDocumentDownloadAccess from '../../hooks/useDocumentDownloadAccess';

const ConferenceDocumentPreview = () => {
  const { conferenceId, fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canDownloadDocuments = useDocumentDownloadAccess();
  const [blobUrl, setBlobUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let objectUrl = '';
    const load = async () => {
      try {
        const { data, headers } = await api.get(
          `/conferences/${conferenceId}/documents/${fileId}/view`,
          { responseType: 'blob' }
        );
        objectUrl = window.URL.createObjectURL(data);
        setBlobUrl(objectUrl);
        setMimeType(headers['content-type'] || data.type);
        const disposition = headers['content-disposition'] || '';
        const match = disposition.match(/filename="([^"]+)"/);
        setFileName(match?.[1] || 'document');
      } catch {
        setError('Unable to load document');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [conferenceId, fileId]);

  const handleDownload = async () => {
    if (!canDownloadDocuments) return;
    const { data } = await api.get(
      `/conferences/${conferenceId}/documents/${fileId}/view?download=1`,
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/conferences?tab=documents')}>Back</Button>
      </Box>
    );
  }

  const isPdf = mimeType.includes('pdf');

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate('/conferences?tab=documents')}>
          Back
        </Button>
        <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 700 }} noWrap>{fileName}</Typography>
        {canDownloadDocuments && (
          <Button variant="contained" startIcon={<DownloadOutlined />} onClick={handleDownload}>
            Download
          </Button>
        )}
      </Stack>
      <Box sx={{ flex: 1, bgcolor: 'grey.100' }}>
        {isPdf ? (
          <iframe title={fileName} src={blobUrl} style={{ width: '100%', height: '100%', border: 0 }} />
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ mb: 2 }}>
              {canDownloadDocuments
                ? 'Preview not available for this file type. Please download to view.'
                : 'Preview is not available for this file type. View-only access is enabled for your role.'}
            </Typography>
            {canDownloadDocuments && (
              <Button variant="contained" onClick={handleDownload}>Download {fileName}</Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ConferenceDocumentPreview;
