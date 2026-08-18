import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Stack, Chip, Button, Alert, CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import ClinicalReportEditor from './ClinicalReportEditor';
import api from '../services/api';
import useConferenceSocket from '../hooks/useConferenceSocket';
import { ROLES } from '../utils/constants';

const isGpRole = (role) => ['gp', 'guest_gp'].includes(role);

const ConferenceReportPanel = ({ conferenceId, user, isAssignedGp, onRequestEdit }) => {
  const [reports, setReports] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [canEdit, setCanEdit] = useState(true);
  const [editReason, setEditReason] = useState('');

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

  const { emitReportUpdate } = useConferenceSocket(conferenceId, handleRemoteUpdate);

  const activeReport = useMemo(
    () => reports.find((r) => r.user_id === activeUserId),
    [reports, activeUserId]
  );

  const saveSection = async (section, content) => {
    if (!activeReport || !canEdit) return;
    setSaving(section);
    try {
      const { data } = await api.put(`/conferences/${conferenceId}/reports`, {
        section,
        content,
        targetUserId: activeReport.user_id,
      });
      setReports((prev) => prev.map((r) => (r.user_id === data.data.user_id ? data.data : r)));
      emitReportUpdate(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const showAssessment = activeReport && isGpRole(activeReport.participant_role);
  const showConclusion = activeReport && isGpRole(activeReport.participant_role) && (
    isAssignedGp || activeReport.participant_role === 'gp'
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
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Live Clinical Report
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          {reports.map((r) => (
            <Chip
              key={r.user_id}
              label={r.display_name}
              size="small"
              color={activeUserId === r.user_id ? 'primary' : 'default'}
              variant={activeUserId === r.user_id ? 'filled' : 'outlined'}
              onClick={() => setActiveUserId(r.user_id)}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
          ))}
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
                  Assessment {saving === 'assessment' && '· saving…'}
                </Typography>
                <ClinicalReportEditor
                  content={activeReport.assessment}
                  editable={canEdit}
                  onChange={(html) => saveSection('assessment', html)}
                />
              </Box>
            )}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                Recommendations {saving === 'recommendations' && '· saving…'}
              </Typography>
              <ClinicalReportEditor
                content={activeReport.recommendations}
                editable={canEdit}
                onChange={(html) => saveSection('recommendations', html)}
              />
            </Box>
            {showConclusion && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                  Conclusion (Outcomes to be achieved) {saving === 'conclusion' && '· saving…'}
                </Typography>
                <ClinicalReportEditor
                  content={activeReport.conclusion}
                  editable={canEdit}
                  onChange={(html) => saveSection('conclusion', html)}
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
