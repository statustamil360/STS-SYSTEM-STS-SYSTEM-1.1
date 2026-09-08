import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, Stack, Chip, Button, Alert, CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import ClinicalReportEditor from './ClinicalReportEditor';
import api from '../services/api';
import useConferenceSocket from '../hooks/useConferenceSocket';
import { ROLES } from '../utils/constants';

const isGpRole = (role) => ['gp', 'guest_gp'].includes(role);

const ROLE_CHIP = {
  gp: { label: 'GP', color: '#0F766E', bg: '#CCFBF1' },
  ahp: { label: 'AHP', color: '#5B21B6', bg: '#EDE9FE' },
  guest_gp: { label: 'Guest GP', color: '#1D4ED8', bg: '#DBEAFE' },
  guest_ahp: { label: 'Guest AHP', color: '#C2410C', bg: '#FFEDD5' },
};

const roleMeta = (role) => ROLE_CHIP[role] || { label: 'Guest', color: '#92400E', bg: '#FEF3C7' };

const typingKey = (reportUserId, section) => `${reportUserId}:${section}`;

const TypingDots = () => (
  <Box component="span" sx={{ display: 'inline-flex', gap: '3px', ml: 0.6, alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          bgcolor: 'currentColor',
          animation: 'stsChipTyping 1s ease-in-out infinite',
          animationDelay: `${i * 0.16}s`,
          '@keyframes stsChipTyping': {
            '0%, 80%, 100%': { opacity: 0.35, transform: 'translateY(0)' },
            '40%': { opacity: 1, transform: 'translateY(-2px)' },
          },
        }}
      />
    ))}
  </Box>
);

const ConferenceReportPanel = ({ conferenceId, user, isAssignedGp, onRequestEdit }) => {
  const [reports, setReports] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  const [editReason, setEditReason] = useState('');
  const [typingMap, setTypingMap] = useState({});
  const saveTimers = useRef({});
  const typingStopTimers = useRef({});
  const lastTypingEmit = useRef({});

  const fetchReports = useCallback(async () => {
    try {
      const [{ data: reportsRes }, { data: statusRes }] = await Promise.all([
        api.get(`/conferences/${conferenceId}/reports`),
        api.get(`/conferences/${conferenceId}/reports/edit-status`),
      ]);
      setReports(reportsRes.data ?? []);
      setCanEdit(statusRes.data?.canEdit !== false);
      setEditReason(statusRes.data?.reason || '');
      if (!activeUserId && reportsRes.data?.length) {
        const mine = reportsRes.data.find((r) => r.user_id === user.id);
        setActiveUserId(mine?.user_id || reportsRes.data[0].user_id);
      }
    } catch {
      toast.error('Failed to load clinical reports');
    } finally {
      setLoading(false);
    }
  }, [conferenceId, user.id, activeUserId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRemoteUpdate = useCallback(({ report }) => {
    if (!report) return;
    setReports((prev) => prev.map((r) => (r.user_id === report.user_id ? report : r)));
  }, []);

  const handleRemoteTyping = useCallback(({ reportUserId, section, typing, userId }) => {
    if (userId === user.id) return;
    setTypingMap((prev) => {
      const next = { ...prev };
      if (section === '*') {
        Object.keys(next).forEach((key) => {
          if (key.startsWith(`${userId}:`) || key.startsWith(`${reportUserId}:`)) {
            delete next[key];
          }
        });
        return next;
      }
      const key = typingKey(reportUserId, section);
      if (typing) next[key] = true;
      else delete next[key];
      return next;
    });
  }, [user.id]);

  const handleRemoteDraft = useCallback(({ reportUserId, section, content, userId }) => {
    if (userId === user.id || !section || !reportUserId) return;
    setTypingMap((prev) => {
      const next = { ...prev };
      delete next[typingKey(reportUserId, section)];
      return next;
    });
    setReports((prev) => prev.map((r) => (
      r.user_id === reportUserId ? { ...r, [section]: content } : r
    )));
  }, [user.id]);

  const { emitReportUpdate, emitReportTyping, emitReportDraft } = useConferenceSocket(conferenceId, {
    onReportUpdated: handleRemoteUpdate,
    onReportTyping: handleRemoteTyping,
    onReportDraft: handleRemoteDraft,
  });

  const activeReport = useMemo(
    () => reports.find((r) => r.user_id === activeUserId),
    [reports, activeUserId]
  );

  const persistSection = useCallback(async (section, content, reportUserId) => {
    try {
      const { data } = await api.put(`/conferences/${conferenceId}/reports`, {
        section,
        content,
        targetUserId: reportUserId,
      });
      setReports((prev) => prev.map((r) => (r.user_id === data.data.user_id ? data.data : r)));
      emitReportUpdate(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  }, [conferenceId, emitReportUpdate]);

  const commitSection = useCallback((section, content) => {
    if (!activeReport || !canEdit) return;
    const reportUserId = activeReport.user_id;
    emitReportTyping({ reportUserId, section, typing: false });
    emitReportDraft({ reportUserId, section, content });
    setReports((prev) => prev.map((r) => (
      r.user_id === reportUserId ? { ...r, [section]: content } : r
    )));
    clearTimeout(saveTimers.current[section]);
    saveTimers.current[section] = setTimeout(() => {
      persistSection(section, content, reportUserId);
    }, 1200);
  }, [activeReport, canEdit, emitReportDraft, emitReportTyping, persistSection]);

  const handleTyping = useCallback((section) => {
    if (!activeReport || !canEdit) return;
    const reportUserId = activeReport.user_id;
    const now = Date.now();
    if (now - (lastTypingEmit.current[section] || 0) > 350) {
      lastTypingEmit.current[section] = now;
      emitReportTyping({ reportUserId, section, typing: true });
    }
    clearTimeout(typingStopTimers.current[section]);
    typingStopTimers.current[section] = setTimeout(() => {
      emitReportTyping({ reportUserId, section, typing: false });
    }, 1400);
  }, [activeReport, canEdit, emitReportTyping]);

  useEffect(() => () => {
    Object.values(saveTimers.current).forEach(clearTimeout);
    Object.values(typingStopTimers.current).forEach(clearTimeout);
  }, []);

  const showAssessment = activeReport && isGpRole(activeReport.participant_role);
  const showConclusion = activeReport && isGpRole(activeReport.participant_role) && (
    isAssignedGp || activeReport.participant_role === 'gp'
  );

  const chipIsTyping = (reportUserId) => Object.keys(typingMap).some(
    (key) => key.startsWith(`${reportUserId}:`) && typingMap[key]
  );

  const sectionTyping = (section) => Boolean(
    activeReport && typingMap[typingKey(activeReport.user_id, section)]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ px: 2.25, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 1.1 }}>
          Live Clinical Report
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          {reports.map((r) => {
            const typing = chipIsTyping(r.user_id);
            const selected = activeUserId === r.user_id;
            const role = roleMeta(r.participant_role);
            return (
              <Chip
                key={r.user_id}
                label={(
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    {r.display_name}
                    <Box
                      component="span"
                      sx={{
                        px: 0.75,
                        py: '1px',
                        borderRadius: '999px',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        lineHeight: 1.4,
                        bgcolor: selected ? 'rgba(255,255,255,0.22)' : role.bg,
                        color: selected ? '#fff' : role.color,
                      }}
                    >
                      {role.label}
                    </Box>
                    {typing && <TypingDots />}
                  </Box>
                )}
                size="small"
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => setActiveUserId(r.user_id)}
                sx={{ fontWeight: 600, cursor: 'pointer', height: 30 }}
              />
            );
          })}
        </Stack>
      </Box>

      {!canEdit && (
        <Alert severity="warning" sx={{ mx: 2, mt: 1.5, borderRadius: 2 }}>
          {editReason || 'Editing is locked'}
          {user.role !== ROLES.RECEPTIONIST && onRequestEdit && (
            <Button size="small" sx={{ ml: 1 }} onClick={onRequestEdit}>
              Request edit access
            </Button>
          )}
        </Alert>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        {activeReport ? (
          <Stack spacing={2}>
            {showAssessment && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                  Assessment
                  {sectionTyping('assessment') ? ' · typing' : ''}
                </Typography>
                <ClinicalReportEditor
                  content={activeReport.assessment}
                  editable={canEdit}
                  remoteTyping={sectionTyping('assessment')}
                  typingName={activeReport.display_name}
                  onTyping={() => handleTyping('assessment')}
                  onChange={(html) => commitSection('assessment', html)}
                />
              </Box>
            )}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                Recommendations
                {sectionTyping('recommendations') ? ' · typing' : ''}
              </Typography>
              <ClinicalReportEditor
                content={activeReport.recommendations}
                editable={canEdit}
                remoteTyping={sectionTyping('recommendations')}
                typingName={activeReport.display_name}
                onTyping={() => handleTyping('recommendations')}
                onChange={(html) => commitSection('recommendations', html)}
              />
            </Box>
            {showConclusion && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                  Conclusion (Outcomes to be achieved)
                  {sectionTyping('conclusion') ? ' · typing' : ''}
                </Typography>
                <ClinicalReportEditor
                  content={activeReport.conclusion}
                  editable={canEdit}
                  remoteTyping={sectionTyping('conclusion')}
                  typingName={activeReport.display_name}
                  onTyping={() => handleTyping('conclusion')}
                  onChange={(html) => commitSection('conclusion', html)}
                />
              </Box>
            )}
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="body2">No report data yet.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default ConferenceReportPanel;
