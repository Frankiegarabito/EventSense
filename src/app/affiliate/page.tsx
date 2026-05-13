import { DashboardShell } from "@/components/dashboard-shell";
import { AffiliateHub } from "@/components/affiliate-hub";

export default function AffiliatePage() {
  return (
    <DashboardShell>
      <AffiliateHub affiliateCode={process.env.AFFILIATE_CODE ?? "YOUR_CODE"} />
    </DashboardShell>
  );
}
