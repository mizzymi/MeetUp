import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Switch } from "@/components/ui/switch";
import { Camera, Mic, Video } from "lucide-react";
import { DeviceSelect } from "./device-select";
import { useEffect, useMemo, useRef } from "react";
import { SidebarUserData } from "../sidebar/sidebar-user";

type Props = {
  micOn: boolean;
  camOn: boolean;
  setMicOn: (v: boolean) => void;
  setCamOn: (v: boolean) => void;

  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedAudio: string;
  selectedVideo: string;
  setSelectedAudio: (v: string) => void;
  setSelectedVideo: (v: string) => void;

  permissionError: string | null;
  joining: boolean;

  onJoin: () => void;
  shareLink: string;

  user: SidebarUserData;
  localStream?: MediaStream | null;
};

function attachVideo(el: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!el) return;

  if (!stream) {
    try { el.pause(); } catch { }
    if (el.srcObject) el.srcObject = null;
    return;
  }

  if (el.srcObject !== stream) el.srcObject = stream;
  void el.play().catch(() => { });
}

/**
 * PreJoinView
 * - Shows preview video inside the avatar circle when camOn=true and localStream contains live video.
 * - Detaches srcObject whenever camera turns off or stream changes.
 */
export function PreJoinView({
  micOn,
  camOn,
  setMicOn,
  setCamOn,
  audioDevices,
  videoDevices,
  selectedAudio,
  selectedVideo,
  setSelectedAudio,
  setSelectedVideo,
  permissionError,
  joining,
  onJoin,
  shareLink,
  user,
  localStream,
}: Props) {
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const hasLiveVideo = useMemo(() => {
    const vids = localStream?.getVideoTracks?.() ?? [];
    return vids.some((t) => t.readyState === "live");
  }, [localStream]);

  useEffect(() => {
    const stream = camOn && hasLiveVideo ? localStream ?? null : null;
    attachVideo(previewVideoRef.current, stream);
  }, [camOn, hasLiveVideo, localStream]);

  useEffect(() => {
    return () => attachVideo(previewVideoRef.current, null);
  }, []);

  return (
    <div className="min-h-dvh p-6">
      <div className={cn("mx-auto w-full max-w-[980px]", "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl")}>
        <div className="relative grid place-items-center bg-slate-950 text-white aspect-[16/7]">
          <div className="text-center">
            <div className="relative m-auto h-32 w-32 overflow-hidden rounded-full ring-1 ring-white/10">
              {camOn && hasLiveVideo ? (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>

            <div className="mt-2">
              <p className="text-xs text-white"><b>{user.name}</b></p>
              <p className="mt-1 text-xs text-white/60">{user.email}</p>
            </div>

            <div className="mt-7 text-xs text-white/60">
              <span className={micOn ? "text-emerald-400/80" : "text-amber-400/80"}>
                Micrófono {micOn ? "activado" : "desactivado"}
              </span>
              <span className="mx-2 text-white/40">·</span>
              <span className={camOn ? "text-emerald-400/80" : "text-amber-400/80"}>
                Cámara {camOn ? "activada" : "desactivada"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {!!permissionError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {permissionError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-slate-700" />
                  <div className="text-sm font-semibold text-slate-900">Micrófono</div>
                </div>
                <Switch checked={micOn} onCheckedChange={(v) => setMicOn(v)} />
              </div>

              <DeviceSelect
                label="Dispositivo"
                value={selectedAudio}
                onChange={setSelectedAudio}
                devices={audioDevices}
                placeholder="Micrófono predeterminado"
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-slate-700" />
                  <div className="text-sm font-semibold text-slate-900">Cámara</div>
                </div>

                {/* keep your UI debug if you want */}
                <Switch
                  checked={camOn}
                  onCheckedChange={(v) => {
                    console.log("[UI] cam switch ->", v);
                    setCamOn(v);
                  }}
                />
              </div>

              <DeviceSelect
                label="Dispositivo"
                value={selectedVideo}
                onChange={setSelectedVideo}
                devices={videoDevices}
                placeholder="Cámara integrada"
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Enlace de la sala</div>
            <div className="mt-2">
              <Input readOnly value={shareLink} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            <Button intent="primary" leftIcon={Video} onClick={onJoin} disabled={joining}>
              {joining ? "Uniéndose…" : "Unirse"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
