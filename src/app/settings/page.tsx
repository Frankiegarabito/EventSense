import { DashboardShell } from "@/components/dashboard-shell";
import { SettingsView } from "@/components/settings-view";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <SettingsView />
    </DashboardShell>
  );
}
