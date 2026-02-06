type RemoteTrack = { producerId: string; stream: MediaStream };

export function RemoteVideos({ remoteTracks }: { remoteTracks: RemoteTrack[] }) {
    return (
        <div className="space-y-3">
            {remoteTracks.map((r) => (
                <video
                    key={r.producerId}
                    className="w-full rounded-lg bg-black"
                    autoPlay
                    playsInline
                    ref={(el) => {
                        if (!el) return;
                        el.srcObject = r.stream;
                    }}
                />
            ))}

            {remoteTracks.length === 0 ? (
                <div className="text-sm text-slate-500">Esperando a otros participantes…</div>
            ) : null}
        </div>
    );
}
