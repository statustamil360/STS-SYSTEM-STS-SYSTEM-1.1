import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { useEffect, useRef } from 'react';
import { Box, IconButton, Divider, Tooltip } from '@mui/material';
import {
  FormatBold, FormatItalic, FormatUnderlined, FormatListBulleted,
  FormatListNumbered, FormatAlignLeft, FormatAlignCenter, FormatAlignRight,
} from '@mui/icons-material';

const ClinicalReportEditor = ({
  content,
  onChange,
  editable = true,
  minHeight = 140,
}) => {
  const debounceRef = useRef(null);
  const skipUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor: ed }) => {
      if (!onChange) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(ed.getHTML());
      }, 400);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || content === undefined) return;
    const current = editor.getHTML();
    if (content !== current) {
      skipUpdate.current = true;
      editor.commands.setContent(content || '', false);
      skipUpdate.current = false;
    }
  }, [editor, content]);

  if (!editor) return null;

  const btn = (active, onClick, icon, label) => (
    <Tooltip title={label}>
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          borderRadius: 1,
          bgcolor: active ? 'action.selected' : 'transparent',
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {editable && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.25,
            px: 0.5,
            py: 0.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <FormatBold fontSize="small" />, 'Bold')}
          {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <FormatItalic fontSize="small" />, 'Italic')}
          {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <FormatUnderlined fontSize="small" />, 'Underline')}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
          {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <FormatListBulleted fontSize="small" />, 'Bullet list')}
          {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <FormatListNumbered fontSize="small" />, 'Numbered list')}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
          {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <FormatAlignLeft fontSize="small" />, 'Align left')}
          {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <FormatAlignCenter fontSize="small" />, 'Center')}
          {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <FormatAlignRight fontSize="small" />, 'Align right')}
        </Box>
      )}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          minHeight,
          maxHeight: 280,
          overflowY: 'auto',
          fontSize: '0.875rem',
          '& .ProseMirror': {
            outline: 'none',
            minHeight: minHeight - 16,
            '& p': { margin: '0 0 0.5em' },
            '& ul, & ol': { pl: 2.5, my: 0.5 },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default ClinicalReportEditor;
