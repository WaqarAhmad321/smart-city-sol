import { PageHeader } from "@/components/common/page-header";
import { ARFieldViewPlaceholder } from "@/components/field-assistance/ar-field-view-placeholder";

export default function FieldAssistancePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="AR Field Assistance" 
        description="View city data overlays and issue details in the field."
      />
      <ARFieldViewPlaceholder />
    </div>
  );
}
