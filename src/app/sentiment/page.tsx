import { DashboardShell } from "@/components/dashboard-shell";
import { SentimentView } from "@/components/sentiment-view";

export default function SentimentPage() {
  return (
    <DashboardShell>
      <SentimentView />
    </DashboardShell>
  );
}
