import { cn } from "@/lib/cn";

type Props = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    devices: MediaDeviceInfo[];
    placeholder: string;
};

export function DeviceSelect({ label, value, onChange, devices, placeholder }: Props) {
    return (
        <div>
            <label className="text-xs font-semibold text-slate-500">{label}</label>
            <div className="mt-2">
                <select
                    className={cn(
                        "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900",
                        "outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                    )}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={!devices.length}
                >
                    {devices.length === 0 ? (
                        <option value="">{placeholder}</option>
                    ) : (
                        devices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                                {d.label || placeholder}
                            </option>
                        ))
                    )}
                </select>
            </div>
        </div>
    );
}
