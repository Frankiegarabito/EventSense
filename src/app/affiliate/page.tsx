import { DashboardShell } from "@/components/dashboard-shell";
import { AffiliateHub } from "@/components/affiliate-hub";

export default function AffiliatePage() {
  const affiliateCode = process.env.AFFILIATE_CODE;
  if (!affiliateCode) throw new Error("AFFILIATE_CODE env variable is not set — add it to .env.local");

  return (
    <DashboardShell>
      <AffiliateHub affiliateCode={affiliateCode} />
    </DashboardShell>
  );
}
