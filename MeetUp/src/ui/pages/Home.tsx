import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/sidebar/sidebar";
import { AppShell } from "@/components/layout";
import { NextMeetingCard, SectionContainer, TodayMeetingRow, TodayMeetingsList } from "@/components/meetings";
import { Api } from "@/lib/api";
import type { MeDto, MeetingDto } from "@/lib/api/types";
import { durationLabel, formatTime } from "@/lib/time/format";
import { ApiError } from "@/lib/api/client";
import { MobileSidebarDock } from "@/components/sidebar/mobile-sidebar-dock";
import { SidebarNavItemData } from "@/components/sidebar/sidebar-nav";


export function Home() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState<MeDto | null>(null);
    const [nextMeeting, setNextMeeting] = useState<MeetingDto | null>(null);
    const [todayMeetings, setTodayMeetings] = useState<MeetingDto[]>([]);

    // Mobile drawer open state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const [meRes, nextRes, todayRes] = await Promise.all([
                    Api.me(),
                    Api.nextMeeting(),
                    Api.todayMeetings(),
                ]);

                if (!alive) return;

                setMe(meRes);
                setNextMeeting(nextRes);
                setTodayMeetings(todayRes);
            } catch (e) {
                console.log("[Home] data load failed:", e);
                if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                    navigate("/login", { replace: true });
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [navigate]);

    const sidebarUser = useMemo(() => {
        if (!me) return { name: "Loading…", email: "", avatarUrl: undefined };
        return {
            name: me.name ?? "User",
            email: me.email ?? "",
            avatarUrl: me.picture ?? undefined,
        };
    }, [me]);

    const sidebarItems: SidebarNavItemData[] = [
        { label: "Home", href: "/", icon: "home" },
        { label: "Calendar", href: "/calendar", icon: "calendar" },
        { label: "Settings", href: "/settings", icon: "settings" },
    ];

    if (loading) return <div className="p-6">Loading…</div>;

    return (
        <div className="flex min-h-dvh">
            {/* Desktop sidebar */}
            <div className="hidden md:block">
                <Sidebar items={sidebarItems} user={sidebarUser} />
            </div>

            {/* Mobile sidebar drawer + bottom dock */}
            <div className="md:hidden">
                <MobileSidebarDock
                    open={sidebarOpen}
                    onOpenChange={setSidebarOpen}
                    user={sidebarUser}
                >
                    <Sidebar items={sidebarItems} user={sidebarUser} />
                </MobileSidebarDock>
            </div>

            <AppShell>
                {/* Extra padding bottom en móvil para que no tape la bottom bar */}
                <div className="space-y-2 pb-20 md:pb-0">
                    <div className="p-6 space-y-8">
                        <SectionContainer title="Next meeting">
                            {nextMeeting ? (
                                <NextMeetingCard
                                    meeting={{
                                        title: nextMeeting.title,
                                        startsAt: nextMeeting.startsAt,
                                        startsAtLabel: formatTime(nextMeeting.startsAt),
                                        endsAtLabel: formatTime(nextMeeting.endsAt),
                                        hostName: nextMeeting.hostName,
                                    }}
                                />
                            ) : (
                                <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600">
                                    No upcoming meetings.
                                </div>
                            )}
                        </SectionContainer>

                        <SectionContainer title="Today">
                            {todayMeetings.length === 0 ? (
                                <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600">
                                    No meetings scheduled for today.
                                </div>
                            ) : (
                                <TodayMeetingsList>
                                    {todayMeetings.map((m) => (
                                        <TodayMeetingRow
                                            key={m.id}
                                            meeting={{
                                                startLabel: formatTime(m.startsAt),
                                                durationLabel: durationLabel(m.startsAt, m.endsAt),
                                                title: m.title,
                                                hostName: m.hostName,
                                                onDetails: () => console.log("Details", m.id),
                                            }}
                                        />
                                    ))}
                                </TodayMeetingsList>
                            )}
                        </SectionContainer>
                    </div>
                </div>
            </AppShell>
        </div>
    );
}
