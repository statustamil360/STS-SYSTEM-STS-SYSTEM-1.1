import { Box } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { applyMediaDevicesToJitsi, loadMediaDevicePrefs } from '../utils/mediaDevices';

const TOOLBAR_BUTTONS = [
  'microphone',
  'camera',
  'desktop',
  'raisehand',
  'tileview',
  'fullscreen',
];

const hashValue = (value) => encodeURIComponent(String(value || '').replace(/"/g, ''));

const resolveRoom = (jitsiUrl, domain, roomName) => {
  try {
    const parsed = new URL(jitsiUrl);
    return {
      domain: domain || parsed.hostname,
      roomName: roomName || parsed.pathname.replace(/^\/+/, ''),
    };
  } catch {
    return { domain, roomName };
  }
};

const iframeSrc = (url, displayName, patientName, email) => {
  if (!url) return '';
  const name = hashValue(displayName || 'Participant');
  const subject = hashValue(patientName || 'Conference');
  const userEmail = hashValue(email || '');
  const hash = [
    `userInfo.displayName="${name}"`,
    userEmail ? `userInfo.email="${userEmail}"` : '',
    `config.subject="${subject}"`,
    `config.localSubject="${subject}"`,
    'config.hideConferenceSubject=false',
    'config.prejoinPageEnabled=false',
    'config.enableWelcomePage=false',
    'config.enableClosePage=false',
    'config.disableInviteFunctions=true',
    'config.disableSelfViewSettings=true',
    'config.disableDeepLinking=true',
    'config.p2p.enabled=false',
    'config.toolbarConfig.alwaysVisible=true',
    `config.toolbarButtons=${JSON.stringify(TOOLBAR_BUTTONS)}`,
    `interfaceConfig.TOOLBAR_BUTTONS=${JSON.stringify(TOOLBAR_BUTTONS)}`,
    'interfaceConfig.TOOLBAR_ALWAYS_VISIBLE=true',
  ].filter(Boolean).join('&');
  return `${url}#${hash}`;
};

const loadExternalApi = (domain) => new Promise((resolve, reject) => {
  if (window.JitsiMeetExternalAPI) {
    resolve(window.JitsiMeetExternalAPI);
    return;
  }
  const src = `https://${domain}/external_api.js`;
  const existing = document.querySelector(`script[src="${src}"]`);
  const finish = () => {
    if (window.JitsiMeetExternalAPI) resolve(window.JitsiMeetExternalAPI);
    else reject(new Error('Failed to load Jitsi'));
  };
  if (existing) {
    if (existing.getAttribute('data-loaded') === '1' || window.JitsiMeetExternalAPI) {
      finish();
      return;
    }
    existing.addEventListener('load', finish, { once: true });
    existing.addEventListener('error', () => reject(new Error('Failed to load Jitsi')), { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.onload = () => {
    script.setAttribute('data-loaded', '1');
    finish();
  };
  script.onerror = () => reject(new Error('Failed to load Jitsi'));
  document.body.appendChild(script);
});

const isScreenShareLabel = (name) => /'s screen$/i.test(String(name || ''));

const JitsiVideoRoom = forwardRef(({
  domain,
  roomName,
  displayName,
  patientName,
  jitsiUrl,
  userEmail,
  isHost = false,
  onJoined,
  onLeft,
  onEndMeeting,
  onParticipantCount,
}, ref) => {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const closingRef = useRef(false);
  const displayNameRef = useRef(displayName);
  const patientNameRef = useRef(patientName);
  const onJoinedRef = useRef(onJoined);
  const onLeftRef = useRef(onLeft);
  const onEndMeetingRef = useRef(onEndMeeting);
  const onParticipantCountRef = useRef(onParticipantCount);
  const isHostRef = useRef(isHost);
  const fallbackSrcRef = useRef('');
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  displayNameRef.current = displayName;
  patientNameRef.current = patientName;
  onJoinedRef.current = onJoined;
  onLeftRef.current = onLeft;
  onEndMeetingRef.current = onEndMeeting;
  onParticipantCountRef.current = onParticipantCount;
  isHostRef.current = isHost;

  const hangup = () => {
    closingRef.current = true;
    const api = apiRef.current;
    if (!api) return;
    try {
      api.executeCommand('hangup');
    } catch {
      /* already closed */
    }
  };

  const endConference = () => {
    closingRef.current = true;
    const api = apiRef.current;
    if (!api) return;
    try {
      api.executeCommand('endConference');
    } catch {
      /* host may not be Jitsi moderator */
    }
    try {
      api.executeCommand('hangup');
    } catch {
      /* already closed */
    }
  };

  useImperativeHandle(ref, () => ({
    hangup,
    endConference,
  }));

  useEffect(() => {
    closingRef.current = false;
    setUseIframeFallback(false);
    const resolved = resolveRoom(jitsiUrl, domain, roomName);
    if (!resolved.domain || !resolved.roomName) {
      setUseIframeFallback(true);
      return undefined;
    }

    let cancelled = false;
    let joinWatchdog;

    const kickParticipant = (participantId) => {
      const api = apiRef.current;
      if (!api || !participantId) return;
      try {
        api.executeCommand('kickParticipant', participantId);
      } catch {
        /* only the moderator can kick */
      }
    };

    const kickMatchingRemotes = (joinedName, keepId) => {
      const api = apiRef.current;
      const name = String(joinedName || '').trim().toLowerCase();
      if (!api?.getParticipantsInfo || !name || isScreenShareLabel(name)) return;
      for (const participant of api.getParticipantsInfo()) {
        if (participant.local || participant.participantId === keepId) continue;
        const otherName = String(participant.displayName || '').trim().toLowerCase();
        if (otherName === name) kickParticipant(participant.participantId);
      }
    };

    const start = async () => {
      let ExternalApi;
      try {
        ExternalApi = await loadExternalApi(resolved.domain);
      } catch {
        if (!cancelled) setUseIframeFallback(true);
        return;
      }
      if (cancelled || !containerRef.current || !ExternalApi) {
        if (!cancelled) setUseIframeFallback(true);
        return;
      }

      containerRef.current.innerHTML = '';
      const mediaPrefs = loadMediaDevicePrefs();
      const api = new ExternalApi(resolved.domain, {
        roomName: resolved.roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: displayNameRef.current || 'Participant',
          email: userEmail || undefined,
        },
        configOverwrite: {
          subject: patientNameRef.current || 'Conference',
          localSubject: patientNameRef.current || 'Conference',
          hideConferenceSubject: false,
          prejoinPageEnabled: false,
          prejoinConfig: { enabled: false },
          enableWelcomePage: false,
          enableClosePage: false,
          disableInviteFunctions: true,
          disableDeepLinking: true,
          disableSelfViewSettings: true,
          hideSelfView: false,
          enableEndConference: false,
          p2p: { enabled: false },
          toolbarButtons: TOOLBAR_BUTTONS,
          toolbarConfig: {
            alwaysVisible: true,
            initialTimeout: 120000,
            timeout: 120000,
          },
          devices: {
            videoInput: mediaPrefs.cameraId || undefined,
            audioInput: mediaPrefs.microphoneId || undefined,
            audioOutput: mediaPrefs.speakerId || undefined,
          },
          remoteVideoMenu: {
            disableGrantModerator: true,
            disablePrivateChat: true,
          },
          participantMenuButtonsWithNotifyClick: [
            { key: 'hide-self-view', preventExecution: true },
          ],
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          HIDE_INVITE_MORE_HEADER: true,
          TOOLBAR_ALWAYS_VISIBLE: true,
          DEFAULT_BACKGROUND: '#0f172a',
        },
      });

      apiRef.current = api;

      const reportParticipantCount = () => {
        try {
          const count = Number(api.getNumberOfParticipants?.() || 0);
          onParticipantCountRef.current?.(Math.max(count, 1));
        } catch {
          /* ignore */
        }
      };

      api.addListener('videoConferenceJoined', () => {
        applyMediaDevicesToJitsi(api);
        onJoinedRef.current?.();
        reportParticipantCount();
        const subject = patientNameRef.current;
        if (subject) {
          try {
            api.executeCommand('subject', subject);
          } catch {
            /* ignore */
          }
        }
        joinWatchdog = window.setTimeout(() => {
          kickMatchingRemotes(displayNameRef.current);
          reportParticipantCount();
        }, 600);
      });

      api.addListener('participantJoined', ({ id, displayName: joinedName } = {}) => {
        window.setTimeout(() => {
          kickMatchingRemotes(joinedName || displayNameRef.current, id);
          reportParticipantCount();
        }, 300);
      });

      api.addListener('participantLeft', () => {
        window.setTimeout(reportParticipantCount, 200);
      });

      api.addListener('videoConferenceLeft', () => {
        if (closingRef.current) return;
        closingRef.current = true;
        if (isHostRef.current) {
          onEndMeetingRef.current?.();
          return;
        }
        onLeftRef.current?.();
      });

      api.addListener('readyToClose', () => {
        const current = apiRef.current;
        apiRef.current = null;
        if (!current) return;
        try {
          current.dispose();
        } catch {
          /* already disposed */
        }
      });
    };

    start();

    return () => {
      cancelled = true;
      if (joinWatchdog) window.clearTimeout(joinWatchdog);
      closingRef.current = true;
      const api = apiRef.current;
      apiRef.current = null;
      if (!api) return;
      try {
        api.executeCommand('hangup');
      } catch {
        /* already closed */
      }
      try {
        api.dispose();
      } catch {
        /* already disposed */
      }
    };
  // Recreate only when the Jitsi room identity changes — not when labels update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, roomName, jitsiUrl, userEmail]);

  if (!jitsiUrl && !(domain && roomName)) {
    return <Box sx={{ height: '100%', minHeight: 480, bgcolor: '#0f172a' }} />;
  }

  if (useIframeFallback) {
    if (jitsiUrl && !fallbackSrcRef.current) {
      fallbackSrcRef.current = iframeSrc(jitsiUrl, displayName, patientName, userEmail);
    }
    return (
      <Box
        component="iframe"
        title="Conference meeting"
        src={fallbackSrcRef.current || iframeSrc(jitsiUrl, displayName, patientName, userEmail)}
        allow="camera *; microphone *; display-capture *; autoplay *; fullscreen *; clipboard-write *"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onLoad={() => onJoined?.()}
        sx={{
          display: 'block',
          width: '100%',
          height: '100%',
          minHeight: 0,
          border: 0,
          bgcolor: '#0f172a',
        }}
      />
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        bgcolor: '#0f172a',
        '& iframe': {
          display: 'block',
          width: '100%',
          height: '100%',
          border: 0,
        },
      }}
    />
  );
});

JitsiVideoRoom.displayName = 'JitsiVideoRoom';

export default JitsiVideoRoom;
