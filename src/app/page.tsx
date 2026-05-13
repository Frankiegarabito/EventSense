import { DashboardShell } from "@/components/dashboard-shell";
import { EventGrid } from "@/components/event-grid";

export default function Home() {
  return (
    <DashboardShell>
      <EventGrid />
    </DashboardShell>
  );
}
