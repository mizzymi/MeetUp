import { useCallback, useEffect, useMemo, useState } from "react";
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

export function MeetRoomPage() {
  const navigate = useNavigate();

  const resolvedRoomId = useMeetRoomId();
  const {
    joined,
    join,
    leave,
    localStream,
    remoteTracks,
    setMicEnabled,
    setCamEnabled,
  } = useSfuRoom(resolvedRoomId);

  const [loading, setLoading] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [me, setMe] = useState<MeDto | null>(null);

  const [meetings, setMeetings] = useState<any[]>([]);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

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
  const toggleMic = useCallback(() => {
    setMicOn((prev) => {
      const next = !prev;
      if (joined) void setMicEnabled(next, devices.selectedAudio ?? undefined);
      return next;
    });
  }, [joined, setMicEnabled, devices.selectedAudio]);

  const toggleCam = useCallback(() => {
    setCamOn((prev) => {
      const next = !prev;
      if (joined) void setCamEnabled(next, devices.selectedVideo ?? undefined);
      return next;
    });
  }, [joined, setCamEnabled, devices.selectedVideo]);
  /**
   * Preview stream (pre-join):
   * - Se recrea si faltan tracks según micOn/camOn o cambian los deviceId seleccionados
   * - Se para al unirse (joined=true)
   */
  useEffect(() => {
    if (joined) return;

    let alive = true;

    async function ensurePreview() {
      // Si no queremos nada, apagamos todo.
      if (!camOn && !micOn) {
        setPreviewStream((prev) => {
          prev?.getTracks().forEach((t) => t.stop());
          return null;
        });
        return;
      }

      const hasAudio = !!previewStream?.getAudioTracks().length;
      const hasVideo = !!previewStream?.getVideoTracks().length;

      // ¿El stream actual no coincide con lo que pedimos?
      const needsNewStream =
        !previewStream ||
        (micOn && !hasAudio) ||
        (!micOn && hasAudio) ||
        (camOn && !hasVideo) ||
        (!camOn && hasVideo);

      if (!needsNewStream) return;

      // Parar el anterior antes de crear uno nuevo
      previewStream?.getTracks().forEach((t) => t.stop());

      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: micOn
            ? devices.selectedAudio
              ? { deviceId: { exact: devices.selectedAudio } }
              : true
            : false,
          video: camOn
            ? devices.selectedVideo
              ? { deviceId: { exact: devices.selectedVideo } }
              : true
            : false,
        });

        if (!alive) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }

        setPreviewStream(s);
      } catch (e) {
        console.error("[MeetRoom] preview getUserMedia failed", e);
        permissions.setError("No se pudo acceder a micrófono/cámara. Revisa permisos del navegador.");
        setCamOn(false);
      }
    }

    void ensurePreview();

    return () => {
      alive = false;
    };
  }, [
    joined,
    camOn,
    micOn,
    devices.selectedAudio,
    devices.selectedVideo,
    previewStream,
    permissions,
  ]);

  /**
   * Al unirse, paramos el preview para no duplicar cámara/micro
   */
  useEffect(() => {
    if (!joined) return;

    setPreviewStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, [joined]);

  /**
   * Si ya estás joined, habilita/deshabilita tracks existentes según micOn/camOn
   * (Si entraste sin vídeo y luego activas camOn, necesitas soporte en useSfuRoom para añadir track.)
   */
  useEffect(() => {
    if (!joined) return;
    if (!localStream) return;

    localStream.getAudioTracks().forEach((t) => (t.enabled = micOn));
    localStream.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [joined, localStream, micOn, camOn]);

  async function handleJoin() {
    if (!resolvedRoomId.trim()) {
      permissions.setError("Sala inválida (roomId vacío).");
      return;
    }

    setJoining(true);
    try {
      const ok = await permissions.ensure(false);
      if (!ok) return;

      await join({
        micOn,
        camOn,
        stream: previewStream,
      });

      // el effect de joined ya parará el previewStream
    } catch (e) {
      console.error("[MeetRoom] join failed:", e);
      permissions.setError("No se pudo unir a la sala.");
    } finally {
      setJoining(false);
    }
  }

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      void leave();
      setPreviewStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleLeaveRoom = useCallback(async () => {
    await leave();
    navigate("/");
  }, [leave, navigate]);

  const meeting = useMemo(() => {
    return meetings.find((m) => m.roomId === resolvedRoomId) ?? null;
  }, [meetings, resolvedRoomId]);

  const meetingTitle = meeting?.title ?? "Reunión";

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
