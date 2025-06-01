
"use client";
import { PageHeader } from "@/components/common/page-header";
import { IssueListItem } from "@/components/issues/issue-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import type { Issue } from "@/types";
import { collection, query, orderBy, limit, getDocs, where, Timestamp, GeoPoint } from "firebase/firestore";
import { Filter, Search, PlusCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

interface IssueFirebase extends Omit<Issue, 'createdAt' | 'updatedAt' | 'location'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  location: GeoPoint; // Firestore GeoPoint
  locationAddress?: string;
}


export default function IssuesListPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchIssues = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let q = query(collection(db, "issues"), orderBy("createdAt", "desc"), limit(50));
      // Note: Compound queries require Firestore indexes. For now, filtering is client-side.
      // For server-side filtering:
      // if (categoryFilter !== "all") {
      //   q = query(q, where("category", "==", categoryFilter));
      // }
      // if (statusFilter !== "all") {
      //   q = query(q, where("status", "==", statusFilter));
      // }

      const querySnapshot = await getDocs(q);
      const fetchedIssues: Issue[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as IssueFirebase;
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
          location: { // Convert GeoPoint to app's Location type
            lat: data.location.latitude,
            lng: data.location.longitude,
            address: data.locationAddress || `${data.location.latitude.toFixed(3)}, ${data.location.longitude.toFixed(3)}`,
          }
        } as Issue;
      });
      setIssues(fetchedIssues);
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError("Failed to load issues. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []); // Fetch on mount

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const searchMatch = searchTerm === "" || 
                          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (issue.locationAddress && issue.locationAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === "all" || issue.category === categoryFilter;
      const statusMatch = statusFilter === "all" || issue.status === statusFilter;
      return searchMatch && categoryMatch && statusMatch;
    });
  }, [issues, searchTerm, categoryFilter, statusFilter]);

  const issueCategories = useMemo(() => ["all", ...new Set(issues.map(i => i.category).sort())], [issues]);
  const issueStatuses = useMemo(() => ["all", "Pending", "Assigned", "In Progress", "Resolved", "Closed"], []);


  const handleApplyFilters = () => {
    // If filtering was server-side, fetchIssues() would be called here.
    // Since it's client-side for now, this button mainly serves as a visual cue
    // or could trigger more complex client-side logic if needed.
    console.log("Applying filters (client-side):", { searchTerm, categoryFilter, statusFilter });
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Reported Issues" description="Track and manage all reported civic issues.">
        <div className="flex items-center gap-2">
           <Button asChild>
             <Link href="/report-issue"><PlusCircle className="mr-2 h-4 w-4" /> Report New Issue</Link>
           </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card shadow-sm">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search issues by title, ID, or keyword..." 
            className="pl-8 w-full" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            {issueCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
             {issueStatuses.map(stat => (
              <SelectItem key={stat} value={stat}>{stat === "all" ? "All Statuses" : stat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="w-full md:w-auto" onClick={handleApplyFilters}>
          <Filter className="mr-2 h-4 w-4" /> Apply Filters
        </Button>
      </div>
      
      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-card">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-grow">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )}

      {error && (
         <div className="text-center py-12 text-destructive bg-destructive/10 p-6 rounded-lg">
           <AlertTriangle className="mx-auto h-12 w-12 mb-4"/>
           <p className="text-lg font-semibold">Error Loading Issues</p>
           <p>{error}</p>
           <Button onClick={fetchIssues} className="mt-4">Try Again</Button>
         </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableCaption>A list of recently reported issues from Firebase.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported On</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => (
                <IssueListItem key={issue.id} issue={issue} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
       {!isLoading && !error && filteredIssues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No issues found.</p>
          <p className="text-muted-foreground">Try adjusting your filters or report a new issue.</p>
        </div>
      )}
    </div>
  );
}
