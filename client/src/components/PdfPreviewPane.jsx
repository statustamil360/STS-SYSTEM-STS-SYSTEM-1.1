import { useEffect, useState } from 'react';
import { Box, IconButton, Stack, Typography, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  OpenInNewOutlined, ZoomInOutlined, ZoomOutOutlined,
  ChevronLeftOutlined, ChevronRightOutlined,
} from '@mui/icons-material';

const ZOOM_STEPS = [75, 100, 125, 150, 200];

const headerBtnSx = {
  color: 'common.white',
  bgcolor: alpha('#FFFFFF', 0.12),
  '&:hover': { bgcolor: alpha('#FFFFFF', 0.22) },
  '&.Mui-disabled': { color: alpha('#FFFFFF', 0.35), bgcolor: alpha('#FFFFFF', 0.06) },
};

export const countPdfPages = async (url) => {
  if (!url) return 1;
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('latin1').decode(buf);
    const catalog = text.match(/\/Type\s*\/Pages[\s\S]{0,400}?\/Count\s+(\d+)/);
    if (catalog) return Math.max(1, Number(catalog[1]));
    const pages = text.match(/\/Type\s*\/Page(?!s)/g);
    return Math.max(1, pages?.length || 1);
  } catch {
    return 1;
  }
};

export const PdfPreviewToolbar = ({
  page,
  pageCount,
  zoom,
  onPageChange,
  onZoomChange,
  onOpenTab,
}) => {
  const zoomIndex = ZOOM_STEPS.indexOf(zoom);

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
      {onOpenTab && (
        <Tooltip title="Open in new tab">
          <IconButton size="small" onClick={onOpenTab} sx={headerBtnSx}>
            <OpenInNewOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Zoom out">
        <span>
          <IconButton
            size="small"
            disabled={zoomIndex <= 0}
            onClick={() => onZoomChange(ZOOM_STEPS[Math.max(0, zoomIndex - 1)])}
            sx={headerBtnSx}
          >
            <ZoomOutOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center', fontWeight: 700 }}>
        {zoom}%
      </Typography>
      <Tooltip title="Zoom in">
        <span>
          <IconButton
            size="small"
            disabled={zoomIndex === -1 || zoomIndex >= ZOOM_STEPS.length - 1}
            onClick={() => onZoomChange(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1)])}
            sx={headerBtnSx}
          >
            <ZoomInOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Previous page">
        <span>
          <IconButton
            size="small"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            sx={headerBtnSx}
          >
            <ChevronLeftOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="caption" sx={{ minWidth: 44, textAlign: 'center', fontWeight: 700 }}>
        {page}/{pageCount}
      </Typography>
      <Tooltip title="Next page">
        <span>
          <IconButton
            size="small"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            sx={headerBtnSx}
          >
            <ChevronRightOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
};

export const PdfPreviewFrame = ({ url, fileName, page, zoom }) => {
  const src = `${url}#toolbar=0&navpanes=0&scrollbar=1&page=${page}&zoom=${zoom}`;
  return (
    <Box sx={{ width: '100%', height: { xs: '60vh', md: '72vh' }, bgcolor: 'common.white' }}>
      <iframe
        key={src}
        title={fileName}
        src={src}
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </Box>
  );
};

export const usePdfPreviewControls = (url, open) => {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!open || !url) {
      setPage(1);
      setPageCount(1);
      setZoom(100);
      return undefined;
    }
    let active = true;
    countPdfPages(url).then((count) => {
      if (active) {
        setPageCount(count);
        setPage(1);
        setZoom(100);
      }
    });
    return () => { active = false; };
  }, [url, open]);

  return { page, setPage, pageCount, zoom, setZoom };
};
