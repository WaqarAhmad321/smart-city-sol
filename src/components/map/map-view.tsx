"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Issue } from "@/types";
import Image from "next/image";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Layers, Loader2, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  GeoPoint,
  Timestamp,
  where,
} from "firebase/firestore";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMapType, Icon as LeafletIconType } from "leaflet";

import dynamic from "next/dynamic";
import { useMap } from "react-leaflet"; // Directly import useMap

// Dynamically import react-leaflet components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder />,
  },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

function MapLoadingPlaceholder() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50 rounded-lg md:rounded-none md:rounded-r-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p>Loading map components...</p>
    </div>
  );
}

interface IssueFirebase
  extends Omit<Issue, "createdAt" | "updatedAt" | "location"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  location: GeoPoint;
  locationAddress?: string;
}

function RecenterAutomatically({
  issues,
  leafletInstance,
}: {
  issues: Issue[];
  leafletInstance: typeof import("leaflet") | null;
}) {
  const map = useMap(); // useMap is now directly imported and used here

  useEffect(() => {
    if (!map || !leafletInstance || !issues) {
      return;
    }

    if (issues.length > 0) {
      if (typeof leafletInstance.latLngBounds !== "function") {
        if (typeof map.setView === "function")
          map.setView([34.0522, -118.2437], 10); // Fallback
        return;
      }
      const issueLatLngs = issues.map(
        (issue) => [issue.location.lat, issue.location.lng] as [number, number],
      );

      const bounds = leafletInstance.latLngBounds(issueLatLngs);
      if (bounds.isValid()) {
        if (typeof map.fitBounds === "function")
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else if (issues.length === 1) {
        if (typeof map.setView === "function")
          map.setView([issues[0].location.lat, issues[0].location.lng], 13);
      } else {
        if (typeof map.setView === "function")
          map.setView([34.0522, -118.2437], 10);
      }
    } else {
      if (typeof map.setView === "function")
        map.setView([34.0522, -118.2437], 10);
    }
  }, [issues, map, leafletInstance]);
  return null;
}

export function MapView() {
  const [isClient, setIsClient] = useState(false);
  const [leafletInstance, setLeafletInstance] = useState<
    typeof import("leaflet") | null
  >(null);
  const [defaultIcon, setDefaultIcon] = useState<LeafletIconType | null>(null);

  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [errorLoadingIssues, setErrorLoadingIssues] = useState<string | null>(
    null,
  );

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    DateRange | undefined
  >();

  const mapWrapperKey = useMemo(
    () =>
      isClient && leafletInstance && defaultIcon
        ? "map-loaded"
        : "map-not-loaded",
    [isClient, leafletInstance, defaultIcon],
  );

  useEffect(() => {
    setIsClient(true);
    import("leaflet")
      .then((L) => {
        setLeafletInstance(L);
        if (
          L &&
          L.Icon &&
          typeof L.Icon.Default === "function" &&
          L.Icon.Default.prototype
        ) {
          // @ts-ignore _getIconUrl might not be in types
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
            iconUrl: require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
          });
          setDefaultIcon(new L.Icon.Default());
        } else {
          console.error(
            "Leaflet or L.Icon.Default is not fully initialized for icon fix.",
          );
        }
      })
      .catch((error) => console.error("Failed to load Leaflet module", error));
  }, []);

  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoadingIssues(true);
      setErrorLoadingIssues(null);
      try {
        // Base query
        let q = query(collection(db, "issues"), orderBy("createdAt", "desc"));

        // Apply filters if they are set
        // Note: Firestore requires composite indexes for many compound queries.
        // These filters are applied server-side if possible, or client-side later.
        // For simplicity, let's assume these specific filters might lead to client-side filtering
        // if indexes are not set up, or we can adjust the query.
        // Example of adding where clauses (ensure indexes in Firestore):
        // if (categoryFilter !== "all") {
        //   q = query(q, where("category", "==", categoryFilter));
        // }
        // if (statusFilter !== "all") {
        //    q = query(q, where("status", "==", statusFilter));
        // }
        // Date range filtering is typically harder with Firestore 'where' clauses directly
        // unless you structure your data for it (e.g. storing day/month/year fields).
        // We'll fetch a broader set and filter client-side by date for now.

        q = query(q, limit(100)); // Keep a limit to avoid fetching too much data

        const querySnapshot = await getDocs(q);
        const fetchedIssues: Issue[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as IssueFirebase;
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            location: {
              lat: data.location.latitude,
              lng: data.location.longitude,
              address:
                data.locationAddress ||
                `${data.location.latitude.toFixed(3)}, ${data.location.longitude.toFixed(3)}`,
            },
          } as Issue;
        });
        setAllIssues(fetchedIssues);
      } catch (err) {
        console.error("Error fetching issues for map:", err);
        setErrorLoadingIssues("Failed to load issues for the map.");
      } finally {
        setIsLoadingIssues(false);
      }
    };
    fetchIssues();
  }, []); // Fetch initial issues on mount

  const issueCategoryOptions = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      ...[...new Set(allIssues.map((issue) => issue.category))]
        .sort()
        .map((category) => ({ value: category, label: category })),
    ],
    [allIssues],
  );

  const issueStatusOptions = useMemo(
    () =>
      [
        { value: "all", label: "All Statuses" },
        "Pending",
        "Assigned",
        "In Progress",
        "Resolved",
        "Closed",
      ].map((status) => ({
        value: status,
        label: status === "all" ? "All Statuses" : status,
      })),
    [],
  );

  const departmentOptions = useMemo(
    () => [
      { value: "all", label: "All Departments" },
      // Example: { value: "dept1", label: "Public Works" } - populate from actual department data if available
    ],
    [],
  );

  const handleMarkerClick = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const filteredIssues = useMemo(() => {
    return allIssues.filter((issue) => {
      const categoryMatch =
        categoryFilter === "all" || issue.category === categoryFilter;
      const statusMatch =
        statusFilter === "all" || issue.status === statusFilter;

      // Department filter logic (assuming issue.assignedTo stores department ID or name)
      const departmentMatch =
        departmentFilter === "all" || issue.assignedTo === departmentFilter;

      let dateMatch = true;
      if (dateRangeFilter?.from) {
        dateMatch =
          dateMatch && new Date(issue.createdAt) >= dateRangeFilter.from;
      }
      if (dateRangeFilter?.to) {
        const inclusiveToDate = new Date(dateRangeFilter.to);
        inclusiveToDate.setHours(23, 59, 59, 999); // Ensure end of day inclusivity
        dateMatch = dateMatch && new Date(issue.createdAt) <= inclusiveToDate;
      }
      return categoryMatch && statusMatch && departmentMatch && dateMatch;
    });
  }, [
    allIssues,
    categoryFilter,
    statusFilter,
    departmentFilter,
    dateRangeFilter,
  ]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setDateRangeFilter(undefined);
    setSelectedIssue(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-card rounded-lg">
      <div className="w-full md:w-1/3 p-4 border-r border-border overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 font-headline">Filters</h3>
        <div className="space-y-4">
          {/* {issueCategoryOptions.length > 1 && <Select onValueChange={setCategoryFilter} value={categoryFilter} disabled={isLoadingIssues}>
            <SelectTrigger><SelectValue placeholder="Filter by Issue Type" /></SelectTrigger>
            <SelectContent>
              {issueCategoryOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>} */}
          {/* {issueStatusOptions.length > 1 && <Select onValueChange={setStatusFilter} value={statusFilter} disabled={isLoadingIssues}>
            <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
            <SelectContent>
              {issueStatusOptions.map(opt => (
                 <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>} */}
          {/* Department filter - enable if department data is available
          {departmentOptions.length > 1 && <Select onValueChange={setDepartmentFilter} value={departmentFilter} disabled={isLoadingIssues}>
            <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
            <SelectContent>
              {departmentOptions.map(opt => (
                 <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>}
          */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Date Range Reported
            </label>
            <DatePickerWithRange
              onDateChange={setDateRangeFilter}
              initialDate={dateRangeFilter}
            />
          </div>
          <Button
            className="w-full"
            onClick={clearFilters}
            variant="outline"
            disabled={isLoadingIssues}
          >
            Clear Filters
          </Button>
        </div>

        {selectedIssue && (
          <Card className="mt-6 shadow-md">
            <CardHeader>
              <CardTitle className="font-headline">
                {selectedIssue.title}
              </CardTitle>
              <CardDescription>
                Status:{" "}
                <span className="font-semibold">{selectedIssue.status}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-3 max-h-[4.5rem] overflow-hidden">
                {selectedIssue.description}
              </p>
              <p className="text-sm">
                <strong>Category:</strong> {selectedIssue.category}
              </p>
              <p className="text-sm">
                <strong>Reported:</strong>{" "}
                {format(new Date(selectedIssue.createdAt), "PPP")}
              </p>
              {selectedIssue.media && selectedIssue.media.length > 0 && (
                <div className="mt-2 relative w-full h-40">
                  <Image
                    src={selectedIssue.media[0].url}
                    alt={selectedIssue.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                    data-ai-hint="map issue"
                  />
                </div>
              )}
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <a
                  href={`/issues/${selectedIssue.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Full Details
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
        {!selectedIssue && !isLoadingIssues && filteredIssues.length > 0 && (
          <div className="mt-6 p-4 text-center text-muted-foreground border rounded-md">
            <Layers className="mx-auto h-8 w-8 mb-2 text-primary" />
            <p className="font-semibold">
              {filteredIssues.length} issue(s) found matching criteria.
            </p>
            <p className="text-sm">Click on a map marker to see details.</p>
          </div>
        )}
        {!selectedIssue && !isLoadingIssues && errorLoadingIssues && (
          <div className="mt-6 p-4 text-center text-destructive border border-destructive/50 rounded-md bg-destructive/10">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p className="font-semibold">Error loading issues on map.</p>
            <p className="text-sm">{errorLoadingIssues}</p>
          </div>
        )}
        {!selectedIssue &&
          !isLoadingIssues &&
          !errorLoadingIssues &&
          filteredIssues.length === 0 && (
            <div className="mt-6 p-4 text-center text-muted-foreground border rounded-md">
              <p className="font-semibold">
                No issues match your current filters.
              </p>
              <p className="text-sm">Try adjusting or clearing the filters.</p>
            </div>
          )}
        {isLoadingIssues && !selectedIssue && (
          <div className="mt-6 space-y-2 p-4 border rounded-md">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </div>
      <div
        key={mapWrapperKey}
        className="flex-grow bg-muted/50 p-0 md:p-0 min-h-[400px] md:min-h-0 flex items-center justify-center"
      >
        {isClient &&
        leafletInstance &&
        defaultIcon &&
        MapContainer &&
        TileLayer &&
        Marker &&
        Popup ? (
          <MapContainer
            center={[34.0522, -118.2437]}
            zoom={10}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            className="rounded-lg md:rounded-none md:rounded-r-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredIssues.map((issue) => (
              <Marker
                key={issue.id}
                position={[issue.location.lat, issue.location.lng]}
                eventHandlers={{ click: () => handleMarkerClick(issue) }}
                icon={defaultIcon}
              >
                <Popup>
                  <strong>{issue.title}</strong>
                  <br />
                  Category: {issue.category}
                  <br />
                  Status: {issue.status}
                  <br />
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    Show Details
                  </Button>
                </Popup>
              </Marker>
            ))}
            <RecenterAutomatically
              issues={filteredIssues}
              leafletInstance={leafletInstance}
            />
          </MapContainer>
        ) : (
          <MapLoadingPlaceholder />
        )}
      </div>
    </div>
  );
}

export function DatePickerWithRange({
  className,
  initialDate,
  onDateChange,
}: React.HTMLAttributes<HTMLDivElement> & {
  initialDate?: DateRange;
  onDateChange: (date?: DateRange) => void;
}) {
  const [date, setDate] = useState<DateRange | undefined>(initialDate);

  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  const handleSelect = (selectedDate?: DateRange) => {
    setDate(selectedDate);
    onDateChange(selectedDate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
