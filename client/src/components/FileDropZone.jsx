import { useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { AttachFileOutlined, CloudUploadOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export const FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z';

const FileDropZone = ({
  selectedFiles = [],
  onAddFiles,
  onRemoveSelected,
  helperText = 'PDF, Word, Excel, reports, images, and other document formats (max 10MB each). Drag files here or choose from your computer.',
  children,
}) => {
  const [dragOver, setDragOver] = useState(false);

  const addFromList = (list) => {
    const files = Array.from(list || []);
    if (files.length) onAddFiles(files);
  };

  return (
    <Box
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        addFromList(e.dataTransfer.files);
      }}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 2.5,
        border: '1px dashed',
        borderColor: (theme) => (dragOver ? theme.palette.primary.main : theme.palette.divider),
        bgcolor: (theme) => alpha(theme.palette.primary.main, dragOver ? 0.08 : 0.02),
        transition: 'border-color 140ms ease, background-color 140ms ease',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
        <AttachFileOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Attach Files
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {helperText}
      </Typography>
      <Stack
        spacing={1}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          mb: 1.5,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: (theme) => alpha(theme.palette.primary.main, dragOver ? 0.5 : 0.22),
          bgcolor: (theme) => alpha(theme.palette.primary.main, dragOver ? 0.06 : 0.015),
        }}
      >
        <CloudUploadOutlined sx={{ fontSize: 28, color: 'primary.main', opacity: 0.85 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {dragOver ? 'Drop files to attach' : 'Drag and drop files here'}
        </Typography>
        <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2 }}>
          Choose Files
          <input
            hidden
            multiple
            type="file"
            accept={FILE_ACCEPT}
            onChange={(e) => {
              addFromList(e.target.files);
              e.target.value = '';
            }}
          />
        </Button>
      </Stack>
      {selectedFiles.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: children ? 1.5 : 0 }}>
          {selectedFiles.map((file, idx) => (
            <Chip
              key={`${file.name}-${idx}`}
              label={file.name}
              size="small"
              onDelete={onRemoveSelected ? () => onRemoveSelected(idx) : undefined}
            />
          ))}
        </Stack>
      )}
      {children}
    </Box>
  );
};

export default FileDropZone;
