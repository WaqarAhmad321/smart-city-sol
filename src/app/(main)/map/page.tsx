import { PageHeader } from "@/components/common/page-header";
import { MapView } from "@/components/map/map-view";
import { Button } from "@/components/ui/button";
import { ListFilter } from "lucide-react";

export default function MapPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader title="Interactive City Map" description="Visualize issues, proposals, and city data.">
        {/* Button might be redundant if filters are in MapView sidebar, can be removed or repurposed */}
        {/* <Button variant="outline">
          <ListFilter className="mr-2 h-4 w-4" />
          Filters
        </Button> */}
      </PageHeader>
      <div className="flex-grow min-h-[400px] rounded-lg overflow-hidden shadow-lg">
         <MapView />
      </div>
    </div>
  );
}
