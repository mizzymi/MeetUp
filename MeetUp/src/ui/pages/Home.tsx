import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/sidebar/sidebar";
import { AppShell } from "@/components/layout";
import {
  NextMeetingCard,
  SectionContainer,
  TodayMeetingRow,
  TodayMeetingsList,
} from "@/components/meetings";
import { Api } from "@/lib/api";
import type { MeDto, MeetingDto } from "@/lib/api/types";
import { durationLabel, formatTime } from "@/lib/time/format";
import { ApiError } from "@/lib/api/client";
import { openMeetingDetails } from "@/hooks/open-meeting-detail";
import { sidebarItems } from "@/utils/sidebar-items";

export function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeDto | null>(null);
  const [nextMeeting, setNextMeeting] = useState<MeetingDto | null>(null);
  const [todayMeetings, setTodayMeetings] = useState<MeetingDto[]>([]);
  function pickClosestActiveToday(meetings: MeetingDto[], now = new Date()): MeetingDto | null {
    if (!meetings.length) return null;

    const nowMs = now.getTime();

    const inProgress = meetings
      .filter((m) => {
        const s = new Date(m.startsAt).getTime();
        const e = new Date(m.endsAt).getTime();
        return s <= nowMs && nowMs < e;
      })
      .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())[0];

    if (inProgress) return inProgress;

    const upcoming = meetings
      .filter((m) => new Date(m.startsAt).getTime() > nowMs)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];

    return upcoming ?? null;
  }
  /**
   * Loads all home data:
   * - /me
   * - /meetings/next
   * - /meetings/today
   *
   * Used on first mount and on "meetings:changed".
   */
  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [meRes, todayRes] = await Promise.all([
        Api.me(),
        Api.todayMeetings(),
      ]);

      setMe(meRes);
      setTodayMeetings(todayRes);

      setNextMeeting(pickClosestActiveToday(todayRes, new Date()));
    } catch (e) {
      console.log("[Home] data load failed:", e);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Initial load
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

  useEffect(() => {
    const onChanged = () => void load();
    window.addEventListener("meetings:changed", onChanged);
    return () => window.removeEventListener("meetings:changed", onChanged);
  }, [load]);

  const sidebarUser = useMemo(() => {
    if (!me) return { name: "Loading…", email: "", avatarUrl: undefined };
    return {
      name: me.name ?? "User",
      email: me.email ?? "",
      avatarUrl: me.picture ?? undefined,
    };
  }, [me]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="flex min-h-dvh">
      <Sidebar items={sidebarItems} user={sidebarUser} />

      <AppShell title="Inicio">
        {/* Extra padding bottom en móvil para que no tape la bottom bar */}
        <div className="space-y-2 pb-20 md:pb-0">
          <div className="p-6 space-y-8">
            <SectionContainer title="Next meeting">
              {nextMeeting ? (
                <NextMeetingCard
                  meeting={{
                    title: nextMeeting.title,
                    startsAt: nextMeeting.startsAt,
                    endsAt: nextMeeting.endsAt,
                    startsAtLabel: formatTime(nextMeeting.startsAt),
                    endsAtLabel: formatTime(nextMeeting.endsAt),
                    hostName: nextMeeting.hostName,
                    roomUrl: nextMeeting.roomUrl,
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
                        onDetails: () => openMeetingDetails(m.id),
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
