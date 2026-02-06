import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Switch } from "@/components/ui/switch";
import { Camera, Mic, Video } from "lucide-react";
import { DeviceSelect } from "./device-select";
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
  return (
    <div className="min-h-dvh p-6">
      <div
        className={cn(
          "mx-auto w-full max-w-[980px]",
          "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        )}
      >
        <div className="relative grid place-items-center bg-slate-950 text-white aspect-[16/7]">
          <div className="text-center">
            <div className="relative m-auto h-32 w-32 overflow-hidden rounded-full ring-1 ring-white/10">
              {camOn && localStream ? (
                <video
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  ref={(el) => {
                    if (!el) return;
                    if (el.srcObject !== localStream) el.srcObject = localStream;
                  }}
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
              <p className="text-xs text-white">
                <b>{user.name}</b>
              </p>
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
                <Switch checked={micOn} onCheckedChange={setMicOn} />
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
                <Switch checked={camOn} onCheckedChange={setCamOn} />
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
