import { useEffect, useState } from "react";

export function useMeetDevices() {
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudio, setSelectedAudio] = useState<string>("");
    const [selectedVideo, setSelectedVideo] = useState<string>("");

    useEffect(() => {
        let alive = true;

        async function loadDevices() {
            try {
                if (!navigator.mediaDevices?.enumerateDevices) return;

                const list = await navigator.mediaDevices.enumerateDevices();
                if (!alive) return;

                const aud = list.filter((d) => d.kind === "audioinput");
                const vid = list.filter((d) => d.kind === "videoinput");

                setAudioDevices(aud);
                setVideoDevices(vid);

                setSelectedAudio((prev) => prev || aud[0]?.deviceId || "");
                setSelectedVideo((prev) => prev || vid[0]?.deviceId || "");
            } catch (e) {
                console.warn("[MeetRoom] enumerateDevices failed:", e);
            }
        }

        void loadDevices();
        return () => {
            alive = false;
        };
    }, []);

    return {
        audioDevices,
        videoDevices,
        selectedAudio,
        selectedVideo,
        setSelectedAudio,
        setSelectedVideo,
    };
}
