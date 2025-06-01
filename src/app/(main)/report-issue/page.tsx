import { PageHeader } from "@/components/common/page-header";
import { ARCameraViewPlaceholder } from "@/components/report-issue/ar-camera-view-placeholder";
import { IssueReportForm } from "@/components/report-issue/issue-report-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, FileText } from "lucide-react";

export default function ReportIssuePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Report an Issue" 
        description="Submit a new issue using AR or a standard form."
      />
      <Tabs defaultValue="ar-report" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="ar-report"><Camera className="mr-2 h-4 w-4" />AR Report</TabsTrigger>
          <TabsTrigger value="form-report"><FileText className="mr-2 h-4 w-4" />Form Report</TabsTrigger>
        </TabsList>
        <TabsContent value="ar-report" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ARCameraViewPlaceholder />
            <IssueReportForm isARMode={true} />
          </div>
        </TabsContent>
        <TabsContent value="form-report" className="mt-6">
          <IssueReportForm isARMode={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
