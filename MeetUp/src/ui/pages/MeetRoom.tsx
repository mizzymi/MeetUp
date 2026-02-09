import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSfuRoom } from "@/hooks/use-sfu-room";
import { useMeetRoomId } from "@/hooks/use-meet-room-id";
import { useMeetDevices } from "@/hooks/use-meet-devices";
import { useMeetPermissions } from "@/hooks/use-meet-permissions";

import { InCallView } from "@/components/meetings/in-call.view";
import { PreJoinView } from "@/components/meetings/prejoin.view";
import { MeDto } from "@/lib/api/types";
import { Api } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { sidebarItems } from "@/utils/sidebar-items";

/** Stop all tracks from a MediaStream (forces hardware release). */
function stopStream(s: MediaStream | null | undefined) {
  try {
    s?.getTracks?.().forEach((t) => t.stop());
  } catch {
    // no-op
  }
}

/** True if stream contains at least one LIVE track of given kind. */
function hasLiveTrack(s: MediaStream | null | undefined, kind: "audio" | "video") {
  const tracks = kind === "audio" ? s?.getAudioTracks?.() : s?.getVideoTracks?.();
  return !!tracks?.some((t) => t.readyState === "live");
}

/**
 * Clone tracks so preview/base stream can be stopped without killing call tracks.
 * (Track objects are shared; cloning avoids "stop preview stops call".)
 */
function cloneStreamTracks(base: MediaStream, wantsAudio: boolean, wantsVideo: boolean) {
  const out: MediaStreamTrack[] = [];
  if (wantsAudio) for (const t of base.getAudioTracks()) out.push(t.clone());
  if (wantsVideo) for (const t of base.getVideoTracks()) out.push(t.clone());
  return new MediaStream(out);
}

/**
 * MeetRoomPage
 *
 * Phases:
 * - PreJoin: manage previewStream via getUserMedia based on micOn/camOn/device selection.
 * - InCall: mediasoup producers/consumers active.
 *
 * The key preview pattern (robust):
 * - NO mutex. We allow overlaps.
 * - Each preview request gets a token.
 * - If a request resolves stale (token mismatch / joining / joined), we stop it immediately.
 */
export function MeetRoomPage() {
  const navigate = useNavigate();
  const resolvedRoomId = useMeetRoomId();

  const { joined, join, leave, localStream, remoteTracks, setMicEnabled, setCamEnabled } =
    useSfuRoom(resolvedRoomId);

  const [loading, setLoading] = useState(true);

  // UI intent toggles
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);

  // Join transition state
  const [joining, setJoining] = useState(false);
  const joiningRef = useRef(false);

  // Current user + meetings
  const [me, setMe] = useState<MeDto | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);

  // Pre-join preview stream (UI only)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  // Always keep latest preview stream in a ref to stop the correct one
  const previewStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    previewStreamRef.current = previewStream;
  }, [previewStream]);

  // Token to invalidate any in-flight preview request
  const previewTokenRef = useRef(0);

  const devices = useMeetDevices();

  const permissions = useMeetPermissions({
    micOn,
    camOn,
    selectedAudio: devices.selectedAudio,
    selectedVideo: devices.selectedVideo,
  });

  const sidebarUser = useMemo(() => {
    if (!me) return { name: "Loading…", email: "", avatarUrl: undefined };
    return {
      name: me.name ?? "User",
      email: me.email ?? "",
      avatarUrl: me.picture ?? undefined,
    };
  }, [me]);

  const shareLink = `${window.location.origin}/meet/${resolvedRoomId}`;

  /** Stop preview stream and clear state. */
  const stopPreview = useCallback(() => {
    const s = previewStreamRef.current;
    previewStreamRef.current = null;
    setPreviewStream(null);
    stopStream(s);
  }, []);

  /** Cancel any in-flight preview request (late resolves will be killed). */
  const invalidatePreviewRequests = useCallback(() => {
    previewTokenRef.current++;
  }, []);

  /**
   * Toggle mic:
   * - In call: updates SFU producer.
   * - Pre-join: affects preview constraints.
   */
  const toggleMic = useCallback(() => {
    setMicOn((prev) => {
      const next = !prev;
      if (joined) void setMicEnabled(next, devices.selectedAudio ?? undefined);
      return next;
    });
  }, [joined, setMicEnabled, devices.selectedAudio]);

  /**
   * Toggle cam:
   * - In call: updates SFU producer.
   * - Pre-join: affects preview constraints.
   */
  const toggleCam = useCallback(() => {
    setCamOn((prev) => {
      const next = !prev;
      if (joined) void setCamEnabled(next, devices.selectedVideo ?? undefined);
      return next;
    });
  }, [joined, setCamEnabled, devices.selectedVideo]);

  /**
   * PREJOIN PREVIEW EFFECT (no mutex)
   *
   * Behavior:
   * - If neither mic nor cam: stop preview.
   * - Otherwise: ensure preview has required tracks; if not, capture new one.
   * - Any late-resolving request is discarded via token check.
   */
  useEffect(() => {
    if (joined) return;
    if (joiningRef.current || joining) return;

    const wantsAudio = micOn;
    const wantsVideo = camOn;

    // If user wants nothing, kill preview and exit.
    if (!wantsAudio && !wantsVideo) {
      stopPreview();
      return;
    }

    const current = previewStreamRef.current;

    const hasAudio = hasLiveTrack(current, "audio");
    const hasVideo = hasLiveTrack(current, "video");

    const needsNew =
      !current ||
      (wantsAudio && !hasAudio) ||
      (!wantsAudio && hasAudio) ||
      (wantsVideo && !hasVideo) ||
      (!wantsVideo && hasVideo);

    if (!needsNew) return;

    // Create a new token for THIS request; older resolves become stale.
    const myToken = ++previewTokenRef.current;

    (async () => {
      let s: MediaStream | null = null;

      try {
        // IMPORTANT: don't stop the old preview before we succeed,
        // otherwise quick toggles can cause flicker.
        s = await navigator.mediaDevices.getUserMedia({
          audio: wantsAudio
            ? devices.selectedAudio
              ? { deviceId: { exact: devices.selectedAudio } }
              : true
            : false,
          video: wantsVideo
            ? devices.selectedVideo
              ? { deviceId: { exact: devices.selectedVideo } }
              : true
            : false,
        });

        const stale =
          joined ||
          joiningRef.current ||
          joining ||
          previewTokenRef.current !== myToken;

        if (stale) {
          stopStream(s);
          return;
        }

        // Now replace preview safely: stop old one, attach new one.
        const old = previewStreamRef.current;
        previewStreamRef.current = s;
        setPreviewStream(s);
        stopStream(old);
      } catch (e: any) {
        console.error("[MeetRoom] preview getUserMedia failed:", e);

        permissions.setError(
          e?.name === "NotAllowedError"
            ? "Permission denied. Allow camera access in the browser."
            : e?.name === "NotFoundError"
              ? "No camera device found."
              : e?.name === "NotReadableError"
                ? "Camera is busy (used by another app/tab)."
                : "Could not access microphone/camera."
        );
      }
    })();
  }, [
    joined,
    joining,
    micOn,
    camOn,
    devices.selectedAudio,
    devices.selectedVideo,
    permissions,
    stopPreview,
  ]);

  /**
   * If cam is turned off in prejoin, stop video tracks immediately (LED off).
   * Keep audio tracks if micOn still true.
   */
  useEffect(() => {
    if (joined) return;
    if (joiningRef.current || joining) return;
    if (camOn) return;

    setPreviewStream((prev) => {
      if (!prev) return prev;

      try {
        prev.getVideoTracks().forEach((t) => t.stop());
        const audioTracks = prev.getAudioTracks();

        if (audioTracks.length === 0) {
          stopStream(prev);
          previewStreamRef.current = null;
          return null;
        }

        const next = new MediaStream(audioTracks);
        previewStreamRef.current = next;
        return next;
      } catch {
        stopStream(prev);
        previewStreamRef.current = null;
        return null;
      }
    });
  }, [joined, joining, camOn]);

  /** When joined => preview must be dead. */
  useEffect(() => {
    if (!joined) return;
    invalidatePreviewRequests();
    stopPreview();
  }, [joined, invalidatePreviewRequests, stopPreview]);

  /**
   * JOIN
   *
   * Rules:
   * - Stop new preview requests immediately (invalidate token)
   * - Reuse preview as BASE only if it has required tracks
   * - Always pass CLONED tracks into the SFU (call owns its tracks)
   * - Stop preview after join succeeds
   */
  async function handleJoin() {
    if (!resolvedRoomId.trim()) {
      permissions.setError("Invalid room (empty roomId).");
      return;
    }

    joiningRef.current = true;
    setJoining(true);

    // Cancel any late preview resolves
    invalidatePreviewRequests();

    let base: MediaStream | null = previewStreamRef.current;
    let baseCreatedHere = false;

    try {
      const ok = await permissions.ensure(false);
      if (!ok) return;

      const wantsAudio = micOn;
      const wantsVideo = camOn;

      const baseHasAudio = hasLiveTrack(base, "audio");
      const baseHasVideo = hasLiveTrack(base, "video");

      if ((wantsAudio && !baseHasAudio) || (wantsVideo && !baseHasVideo) || (!base && (wantsAudio || wantsVideo))) {
        // Capture a fresh base stream for joining (if preview isn't suitable).
        base = await navigator.mediaDevices.getUserMedia({
          audio: wantsAudio
            ? devices.selectedAudio
              ? { deviceId: { exact: devices.selectedAudio } }
              : true
            : false,
          video: wantsVideo
            ? devices.selectedVideo
              ? { deviceId: { exact: devices.selectedVideo } }
              : true
            : false,
        });

        baseCreatedHere = true;
      }

      // If toggles off, allow join with no tracks.
      if (!base) {
        await join({
          micOn,
          camOn,
          stream: null,
          audioDeviceId: devices.selectedAudio ?? undefined,
          videoDeviceId: devices.selectedVideo ?? undefined,
        });
        stopPreview();
        return;
      }

      // ✅ Call gets CLONED tracks
      const callStream = cloneStreamTracks(base, wantsAudio, wantsVideo);

      await join({
        micOn,
        camOn,
        stream: callStream,
        audioDeviceId: devices.selectedAudio ?? undefined,
        videoDeviceId: devices.selectedVideo ?? undefined,
      });

      // After join: stop preview base stream so it doesn't keep LED on.
      stopPreview();

      // If we created a base stream in this handler, stop it too (call uses clones).
      if (baseCreatedHere) stopStream(base);
    } catch (e) {
      console.error("[MeetRoom] join failed:", e);
      permissions.setError("Could not join the room.");

      if (baseCreatedHere) stopStream(base);
    } finally {
      joiningRef.current = false;
      setJoining(false);
    }
  }

  /** Unmount cleanup. */
  useEffect(() => {
    return () => {
      void leave();
      invalidatePreviewRequests();
      stopPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Load user + meetings. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, meetingsRes] = await Promise.all([Api.me(), Api.todayMeetings()]);
      setMe(meRes);
      setMeetings(meetingsRes ?? []);
    } catch (e) {
      console.log("[MeetRoom] data load failed:", e);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  /** Leave room handler. */
  const handleLeaveRoom = useCallback(async () => {
    await leave();
    navigate("/");
  }, [leave, navigate]);

  const meeting = useMemo(() => {
    return meetings.find((m) => m.roomId === resolvedRoomId) ?? null;
  }, [meetings, resolvedRoomId]);

  const meetingTitle = meeting?.title ?? "Meeting";

  if (loading) return <div className="p-6">Loading…</div>;

  if (joined) {
    return (
      <InCallView
        roomId={resolvedRoomId}
        meetingTitle={meetingTitle}
        localStream={localStream}
        remoteTracks={remoteTracks}
        isMicOn={micOn}
        isCamOn={camOn}
        onBack={() => navigate(-1)}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onOpenChat={() => console.log("open chat")}
        onOpenParticipants={() => console.log("open participants")}
        onLeave={handleLeaveRoom}
        sidebarUser={sidebarUser}
        sidebarItems={sidebarItems}
      />
    );
  }

  return (
    <PreJoinView
      micOn={micOn}
      camOn={camOn}
      setMicOn={setMicOn}
      setCamOn={setCamOn}
      audioDevices={devices.audioDevices}
      videoDevices={devices.videoDevices}
      selectedAudio={devices.selectedAudio}
      selectedVideo={devices.selectedVideo}
      setSelectedAudio={devices.setSelectedAudio}
      setSelectedVideo={devices.setSelectedVideo}
      permissionError={permissions.error}
      joining={joining}
      onJoin={handleJoin}
      shareLink={shareLink}
      user={sidebarUser}
      localStream={previewStream}
    />
  );
}
