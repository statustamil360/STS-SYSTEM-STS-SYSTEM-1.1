import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { useEffect, useRef } from 'react';
import { Box, IconButton, Divider, Tooltip, Typography } from '@mui/material';
import {
  FormatBold, FormatItalic, FormatUnderlined, FormatListBulleted,
  FormatListNumbered, FormatAlignLeft, FormatAlignCenter, FormatAlignRight,
} from '@mui/icons-material';

const insertedChunk = (transaction) => {
  let text = '';
  transaction.steps.forEach((step) => {
    const slice = step.slice;
    if (!slice?.content) return;
    slice.content.forEach((node) => {
      if (node.text) text += node.text;
      else if (node.type?.name === 'hardBreak') text += '\n';
    });
  });
  return text;
};

const ClinicalReportEditor = ({
  content,
  onChange,
  onTyping,
  remoteTyping = false,
  typingName = 'Participant',
  editable = true,
  minHeight = 140,
}) => {
  const idleRef = useRef(null);
  const skipUpdate = useRef(false);
  const onChangeRef = useRef(onChange);
  const onTypingRef = useRef(onTyping);
  onChangeRef.current = onChange;
  onTypingRef.current = onTyping;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor: ed, transaction }) => {
      if (skipUpdate.current) return;
      onTypingRef.current?.();
      const html = ed.getHTML();
      const chunk = insertedChunk(transaction);
      const structural = transaction.steps.some((step) => !step.slice);
      const flushNow = /[\s]/.test(chunk) || structural;
      clearTimeout(idleRef.current);
      if (flushNow) {
        onChangeRef.current?.(html);
        return;
      }
      idleRef.current = setTimeout(() => {
        onChangeRef.current?.(ed.getHTML());
      }, 800);
    },
    onBlur: ({ editor: ed }) => {
      clearTimeout(idleRef.current);
      onChangeRef.current?.(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || content === undefined) return;
    if (editor.isFocused) return;
    const current = editor.getHTML();
    if (content !== current) {
      skipUpdate.current = true;
      editor.commands.setContent(content || '', false);
      skipUpdate.current = false;
    }
  }, [editor, content]);

  useEffect(() => () => clearTimeout(idleRef.current), []);

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
        position: 'relative',
        border: '1px solid',
        borderColor: remoteTyping ? 'primary.light' : 'divider',
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
      {remoteTyping && (
        <Box
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.35,
            borderRadius: 999,
            bgcolor: 'rgba(15,23,42,0.82)',
            color: 'common.white',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
            {typingName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.4, alignItems: 'flex-end', height: 10 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  bgcolor: 'common.white',
                  animation: 'stsTypingBounce 1s ease-in-out infinite',
                  animationDelay: `${i * 0.16}s`,
                  '@keyframes stsTypingBounce': {
                    '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.45 },
                    '40%': { transform: 'translateY(-4px)', opacity: 1 },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClinicalReportEditor;
