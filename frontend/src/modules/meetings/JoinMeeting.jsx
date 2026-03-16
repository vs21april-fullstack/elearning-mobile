import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  fetchMeetingById,
  fetchMeetingJoinConfig,
  recordMeetingPresence,
} from "./meetings.api";
import Spinner from "../../components/Spinner";
import Button from "../../components/Button";
import toast from "react-hot-toast";
import { useAuth } from "../../app/authContext";
import styles from "./JoinMeeting.module.css";

const FALLBACK_JITSI_DOMAIN = (
  import.meta.env.VITE_JITSI_DOMAIN || "meet.jit.si"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

const PARTICIPANT_TOAST_COOLDOWN_MS = 5000;

function MicIcon({ muted = false }) {
  return (
    <svg viewBox="0 0 24 24" className={styles.controlIcon} aria-hidden="true">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 12a7 7 0 0 1-14 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 22h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {muted && (
        <path
          d="M4 4l16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function CameraIcon({ muted = false }) {
  return (
    <svg viewBox="0 0 24 24" className={styles.controlIcon} aria-hidden="true">
      <path
        d="M15 10l5-3v10l-5-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="6"
        width="12"
        height="12"
        rx="2"
        ry="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {muted && (
        <path
          d="M4 4l16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function ScreenShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.controlIcon} aria-hidden="true">
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
        ry="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 20h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 16v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 10l2-2 2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HangupIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.controlIcon} aria-hidden="true">
      <path
        d="M3 14.5c2.8-2 5.8-3 9-3s6.2 1 9 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 16v3a1 1 0 0 0 1 1h2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 16v3a1 1 0 0 1-1 1h-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function JoinMeeting() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const autoJoinAttemptedRef = useRef(false);
  const presenceStateRef = useRef({ hasJoined: false, hasLeft: false });
  const participantNamesRef = useRef(new Map());
  const participantToastTimestampsRef = useRef(new Map());
  const isTeacher = user?.role === "teacher";
  const shouldAutoJoin = isTeacher || location.state?.autoJoin === true;

  const [userName, setUserName] = useState("");
  const [meetingConfig, setMeetingConfig] = useState(null);
  const [hasStartedJoin, setHasStartedJoin] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraMuted, setIsCameraMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isTogglingMic, setIsTogglingMic] = useState(false);
  const [isTogglingCamera, setIsTogglingCamera] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => fetchMeetingById(meetingId),
    enabled: !!meetingId,
  });

  useEffect(() => {
    if (!userName && user?.name) {
      setUserName(user.name);
    }
  }, [userName, user?.name]);

  useEffect(() => {
    autoJoinAttemptedRef.current = false;
    presenceStateRef.current = { hasJoined: false, hasLeft: false };
    participantNamesRef.current.clear();
    participantToastTimestampsRef.current.clear();
  }, [meetingId]);

  const sendPresenceEvent = useCallback(
    async (event) => {
      if (!meetingId) return;

      try {
        await recordMeetingPresence(meetingId, {
          event,
          occurredAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Failed to record meeting ${event} event:`, error);
      }
    },
    [meetingId],
  );

  const handleLeave = useCallback(
    (shouldNavigate = true) => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      setIsJoined(false);
      setHasStartedJoin(false);
      setMeetingConfig(null);
      setParticipantCount(1);
      setIsScreenSharing(false);
      setIsTogglingMic(false);
      setIsTogglingCamera(false);
      participantNamesRef.current.clear();
      participantToastTimestampsRef.current.clear();

      if (shouldNavigate) {
        navigate(-1);
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (!hasStartedJoin || !meetingConfig || !containerRef.current) return;
    if (jitsiApiRef.current) return;

    const domain = meetingConfig.domain || FALLBACK_JITSI_DOMAIN;
    let isDisposed = false;

    const initJitsi = async () => {
      try {
        if (!window.JitsiMeetExternalAPI) {
          const existingScript = document.querySelector(
            `script[data-jitsi-domain="${domain}"]`,
          );

          if (existingScript) {
            existingScript.addEventListener("load", initializeConference, {
              once: true,
            });
            return;
          }

          const script = document.createElement("script");
          script.src = `https://${domain}/external_api.js`;
          script.async = true;
          script.dataset.jitsiDomain = domain;
          script.onload = initializeConference;
          script.onerror = () => {
            toast.error("Failed to load Jitsi Meet. Please try again.");
            setHasStartedJoin(false);
            setIsJoining(false);
          };
          document.body.appendChild(script);
        } else {
          initializeConference();
        }
      } catch (error) {
        console.error("Error loading Jitsi:", error);
        toast.error("Failed to initialize meeting");
      }
    };

    const initializeConference = () => {
      if (isDisposed || !containerRef.current) return;

      try {
        const options = {
          roomName: meetingConfig.roomName,
          parentNode: containerRef.current,
          userInfo: {
            displayName: userName || meetingConfig.user?.name || "Guest",
            email: meetingConfig.user?.email || "",
          },
          configOverwrite: {
            startAudioOnly: false,
            startWithAudioMuted: isMicMuted,
            startWithVideoMuted: isCameraMuted,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            prejoinConfig: {
              enabled: false,
            },
            disableSimulcast: false,
            fileRecordingsEnabled: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            DEFAULT_WELCOME_PAGE_LOGO_URL: "",
            SHOW_CHROME_EXTENSION_BANNER: false,
            MOBILE_APP_PROMO: false,
            TOOLBAR_BUTTONS: [],
          },
        };

        if (meetingConfig.joinToken) {
          options.jwt = meetingConfig.joinToken;
        }

        const api = new window.JitsiMeetExternalAPI(domain, options);

        const updateParticipantCount = () => {
          if (!api?.getNumberOfParticipants) return;
          const count = api.getNumberOfParticipants();
          if (typeof count === "number" && count > 0) {
            setParticipantCount(count);
          }
        };

        const syncLocalMediaState = async () => {
          try {
            if (api?.isAudioMuted) {
              const audioMuted = await api.isAudioMuted();
              if (typeof audioMuted === "boolean") {
                setIsMicMuted(audioMuted);
              }
            }

            if (api?.isVideoMuted) {
              const videoMuted = await api.isVideoMuted();
              if (typeof videoMuted === "boolean") {
                setIsCameraMuted(videoMuted);
              }
            }
          } catch (error) {
            console.error("Failed to sync media state:", error);
          }
        };

        const resolveParticipantName = (
          participantId,
          fallback = "A participant",
        ) => {
          if (!participantId) return fallback;

          const cachedName = participantNamesRef.current.get(participantId);
          if (cachedName) return cachedName;

          if (api?.getParticipantsInfo) {
            const participantInfo = api
              .getParticipantsInfo()
              .find(
                (participant) =>
                  participant.participantId === participantId ||
                  participant.id === participantId,
              );

            const participantName =
              participantInfo?.formattedDisplayName ||
              participantInfo?.displayName ||
              participantInfo?.name;

            if (participantName) {
              participantNamesRef.current.set(participantId, participantName);
              return participantName;
            }
          }

          return fallback;
        };

        const shouldShowParticipantToast = (
          eventType,
          participantId,
          participantName,
        ) => {
          const identity = participantId || participantName;
          if (!identity) return false;

          const now = Date.now();
          const key = `${eventType}:${identity}`;
          const lastShownAt =
            participantToastTimestampsRef.current.get(key) || 0;

          if (now - lastShownAt < PARTICIPANT_TOAST_COOLDOWN_MS) {
            return false;
          }

          participantToastTimestampsRef.current.set(key, now);
          return true;
        };

        api.addEventListener("videoConferenceJoined", () => {
          setIsJoined(true);
          setIsJoining(false);
          updateParticipantCount();
          syncLocalMediaState();

          if (!presenceStateRef.current.hasJoined) {
            presenceStateRef.current.hasJoined = true;
            presenceStateRef.current.hasLeft = false;
            sendPresenceEvent("join");
          }

          toast.success("Successfully joined the meeting!");
        });

        api.addEventListener("participantJoined", (data) => {
          updateParticipantCount();

          const participantId = data?.id || data?.participantId;
          const participantName =
            data?.displayName || resolveParticipantName(participantId);

          if (participantId && participantName) {
            participantNamesRef.current.set(participantId, participantName);
          }

          if (
            shouldShowParticipantToast("join", participantId, participantName)
          ) {
            toast.success(`${participantName} joined`);
          }
        });

        api.addEventListener("participantLeft", (data) => {
          updateParticipantCount();

          const participantId = data?.id || data?.participantId;
          const participantName = resolveParticipantName(participantId);

          if (participantId) {
            participantNamesRef.current.delete(participantId);
          }

          if (
            shouldShowParticipantToast("left", participantId, participantName)
          ) {
            toast(`${participantName} left`);
          }
        });

        api.addEventListener("audioMuteStatusChanged", (data) => {
          setIsMicMuted(data.muted);
        });

        api.addEventListener("videoMuteStatusChanged", (data) => {
          setIsCameraMuted(data.muted);
        });

        api.addEventListener("screenSharingStatusChanged", (data) => {
          setIsScreenSharing(Boolean(data?.on));
        });

        api.addEventListener("readyToClose", () => {
          if (
            presenceStateRef.current.hasJoined &&
            !presenceStateRef.current.hasLeft
          ) {
            presenceStateRef.current.hasLeft = true;
            sendPresenceEvent("leave");
          }

          handleLeave(true);
        });

        api.addEventListener("videoConferenceLeft", () => {
          setIsJoined(false);
          setIsScreenSharing(false);
          setIsTogglingMic(false);
          setIsTogglingCamera(false);

          if (
            presenceStateRef.current.hasJoined &&
            !presenceStateRef.current.hasLeft
          ) {
            presenceStateRef.current.hasLeft = true;
            sendPresenceEvent("leave");
          }
        });

        jitsiApiRef.current = api;
      } catch (error) {
        console.error("Error initializing Jitsi:", error);
        toast.error("Failed to initialize meeting");
        setHasStartedJoin(false);
        setIsJoining(false);
      }
    };

    initJitsi();

    return () => {
      isDisposed = true;
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [
    hasStartedJoin,
    meetingConfig,
    userName,
    isMicMuted,
    isCameraMuted,
    handleLeave,
    sendPresenceEvent,
  ]);

  const handleJoin = useCallback(async () => {
    if (!meetingId) return;

    try {
      setIsJoining(true);
      const data = await fetchMeetingJoinConfig(meetingId, {
        displayName: userName?.trim() || undefined,
      });
      setMeetingConfig(data);
      setHasStartedJoin(true);
    } catch (error) {
      setIsJoining(false);
      toast.error(
        error.response?.data?.message ||
          "Unable to start meeting. Please try again.",
      );
    }
  }, [meetingId, userName]);

  useEffect(() => {
    if (
      !shouldAutoJoin ||
      !meeting ||
      isLoading ||
      hasStartedJoin ||
      isJoining
    ) {
      return;
    }

    if (autoJoinAttemptedRef.current) {
      return;
    }

    autoJoinAttemptedRef.current = true;
    handleJoin();
  }, [
    shouldAutoJoin,
    meeting,
    isLoading,
    hasStartedJoin,
    isJoining,
    handleJoin,
  ]);

  const toggleMicrophone = () => {
    const api = jitsiApiRef.current;
    if (!api || isTogglingMic) return;

    setIsTogglingMic(true);
    api.executeCommand("toggleAudio");

    setTimeout(async () => {
      try {
        if (api?.isAudioMuted) {
          const muted = await api.isAudioMuted();
          if (typeof muted === "boolean") {
            setIsMicMuted(muted);
          }
        }
      } finally {
        setIsTogglingMic(false);
      }
    }, 180);
  };

  const toggleCamera = () => {
    const api = jitsiApiRef.current;
    if (!api || isTogglingCamera) return;

    setIsTogglingCamera(true);
    api.executeCommand("toggleVideo");

    setTimeout(async () => {
      try {
        if (api?.isVideoMuted) {
          const muted = await api.isVideoMuted();
          if (typeof muted === "boolean") {
            setIsCameraMuted(muted);
          }
        }
      } finally {
        setIsTogglingCamera(false);
      }
    }, 180);
  };

  const toggleScreenShare = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleShareScreen");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
        <p>Loading meeting...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className={styles.errorContainer}>
        <h2>Meeting Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!hasStartedJoin && (
        <div className={styles.preJoinScreen}>
          <div className={styles.preJoinCard}>
            <h2>Join Meeting</h2>
            <div className={styles.meetingInfo}>
              <p>
                <strong>Title:</strong> {meeting.title}
              </p>
              <p>
                <strong>Course:</strong> {meeting.course?.title || "N/A"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(meeting.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong> {meeting.startTime} - {meeting.endTime}
              </p>
            </div>

            <div className={styles.preJoinForm}>
              {!shouldAutoJoin && (
                <>
                  <label className={styles.label}>Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className={styles.input}
                  />
                </>
              )}

              <div className={styles.preJoinOptions}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!isMicMuted}
                    onChange={() => setIsMicMuted(!isMicMuted)}
                  />
                  <span>Join with microphone on</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!isCameraMuted}
                    onChange={() => setIsCameraMuted(!isCameraMuted)}
                  />
                  <span>Join with camera on</span>
                </label>
              </div>

              <Button
                variant="primary"
                onClick={handleJoin}
                className={styles.joinButton}
                disabled={isJoining}
              >
                {isJoining ? "Joining..." : "Join Meeting"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.jitsiContainer} ref={containerRef} />

      {isJoined && (
        <div className={styles.controlsOverlay}>
          <div className={styles.controls}>
            <div className={styles.controlsLeft}>
              <span className={styles.participantCount}>
                👥 {participantCount} participant
                {participantCount !== 1 ? "s" : ""}
              </span>
              {isScreenSharing && (
                <span className={styles.statusBadge}>Screen sharing on</span>
              )}
            </div>

            <div className={styles.controlsCenter}>
              <button
                className={`${styles.controlButton} ${
                  isMicMuted ? styles.muted : ""
                }`}
                onClick={toggleMicrophone}
                title="Toggle Microphone"
                aria-label={
                  isMicMuted ? "Unmute microphone" : "Mute microphone"
                }
                disabled={isTogglingMic}
              >
                <MicIcon muted={isMicMuted} />
              </button>
              <button
                className={`${styles.controlButton} ${
                  isCameraMuted ? styles.muted : ""
                }`}
                onClick={toggleCamera}
                title="Toggle Camera"
                aria-label={
                  isCameraMuted ? "Turn camera on" : "Turn camera off"
                }
                disabled={isTogglingCamera}
              >
                <CameraIcon muted={isCameraMuted} />
              </button>
              <button
                className={`${styles.controlButton} ${
                  isScreenSharing ? styles.active : ""
                }`}
                onClick={toggleScreenShare}
                title="Share Screen"
                aria-label={
                  isScreenSharing
                    ? "Stop screen sharing"
                    : "Start screen sharing"
                }
              >
                <ScreenShareIcon />
              </button>
              <button
                className={`${styles.controlButton} ${styles.hangup}`}
                onClick={() => handleLeave(true)}
                title="Leave Meeting"
                aria-label="Leave meeting"
              >
                <HangupIcon />
              </button>
            </div>

            <div className={styles.controlsRight}>
              <Button
                variant="secondary"
                onClick={() => handleLeave(true)}
                className={styles.leaveButton}
              >
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
