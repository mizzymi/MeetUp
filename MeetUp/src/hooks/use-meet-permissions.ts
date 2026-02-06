import { useCallback, useState } from "react";

type Args = {
    micOn: boolean;
    camOn: boolean;
    selectedAudio: string;
    selectedVideo: string;
};

export function useMeetPermissions(args: Args) {
    const [error, setError] = useState<string | null>(null);

    const ensure = useCallback(
        async (force: boolean) => {
            setError(null);

            const wantAudio = force ? true : args.micOn;
            const wantVideo = force ? true : args.camOn;

            if (!wantAudio && !wantVideo) return true;

            try {
                await navigator.mediaDevices.getUserMedia({
                    audio: wantAudio
                        ? { deviceId: args.selectedAudio ? { exact: args.selectedAudio } : undefined }
                        : false,
                    video: wantVideo
                        ? { deviceId: args.selectedVideo ? { exact: args.selectedVideo } : undefined }
                        : false,
                });
                return true;
            } catch (e) {
                console.error("[MeetRoom] getUserMedia failed:", e);
                setError("No se pudo acceder a micrófono/cámara. Revisa permisos del navegador.");
                return false;
            }
        },
        [args.micOn, args.camOn, args.selectedAudio, args.selectedVideo]
    );

    return { error, setError, ensure };
}
