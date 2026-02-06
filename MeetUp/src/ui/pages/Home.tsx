import { Sidebar } from "@/components/sidebar/sidebar";
import { AppShell } from "@/components/layout";
import { NextMeetingCard, SectionContainer, TodayMeetingRow, TodayMeetingsList } from "@/components/meetings";

export function Home() {
    return (
        <div className="flex">
            <Sidebar
                items={[
                    { label: "Inicio", href: "/", icon: "home" },
                    { label: "Calendario", href: "/calendar", icon: "calendar" },
                    { label: "Ajustes", href: "/settings", icon: "settings" },
                ]}
                user={{
                    name: "Carlos Martínez",
                    email: "carlos@email.com",
                    avatarUrl: "/demo/avatar.jpg",
                }}
            />

            <AppShell>
                <div className="space-y-2">
                    <div className="p-6 space-y-8">
                        <SectionContainer title="Próxima reunión">
                            <NextMeetingCard
                                meeting={{
                                    title: "Reunión de proyecto Q1",
                                    startsAt: "2026-02-06T14:30:00",
                                    startsAtLabel: "14:30",
                                    endsAtLabel: "15:30",
                                    hostName: "Ana García",
                                }}
                            />
                        </SectionContainer>

                        <SectionContainer title="Reuniones de hoy">
                            <TodayMeetingsList>
                                <TodayMeetingRow
                                    meeting={{
                                        startLabel: "16:00",
                                        durationLabel: "1h",
                                        title: "Sesión de feedback",
                                        hostName: "Miguel López",
                                        onDetails: () => console.log("Details 1"),
                                    }}
                                />
                                <TodayMeetingRow
                                    meeting={{
                                        startLabel: "17:30",
                                        durationLabel: "1h",
                                        title: "Lo que sea",
                                        hostName: "Manolo López",
                                        onDetails: () => console.log("Details 2"),
                                    }}
                                />
                                <TodayMeetingRow
                                    meeting={{
                                        startLabel: "19:00",
                                        durationLabel: "1h",
                                        title: "Sesión de feedback",
                                        hostName: "Miguel López",
                                        onDetails: () => console.log("Details 3"),
                                    }}
                                />
                            </TodayMeetingsList>
                        </SectionContainer>
                    </div>
                </div>
            </AppShell>
        </div>
    );
}