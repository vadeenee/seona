import { AuditView } from "@/components/AuditView";
import { mockAudit } from "@/lib/mock-audit";

export default function AuditPage() {
  // TODO: replace mockAudit with a real audit fetched by URL/content submitted
  // from the landing page (route param or query string), run through the
  // actual audit engine once it exists.
  return <AuditView result={mockAudit} />;
}
