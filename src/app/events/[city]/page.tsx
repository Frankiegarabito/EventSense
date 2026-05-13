import { DashboardShell } from "@/components/dashboard-shell";
import { EventDeepDive } from "@/components/event-deep-dive";

export default async function EventPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  return (
    <DashboardShell>
      <EventDeepDive city={city} />
    </DashboardShell>
  );
}
