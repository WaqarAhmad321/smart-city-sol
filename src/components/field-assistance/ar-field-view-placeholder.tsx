
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import type { Issue } from "@/types";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { AlertTriangle, Eye, HardHat, Layers, MapPin, Wrench, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";

export function ARFieldViewPlaceholder() {
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [errorLoadingIssues, setErrorLoadingIssues] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentIssues = async () => {
      setIsLoadingIssues(true);
      setErrorLoadingIssues(null);
      try {
        const q = query(
          collection(db, "issues"), 
          where("status", "in", ["Pending", "Assigned", "In Progress"]), 
          orderBy("createdAt", "desc"), 
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const fetchedIssues: Issue[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt instanceof Timestamp 
                            ? data.createdAt.toDate().toISOString() 
                            : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());
          return {
            id: doc.id,
            ...data,
            createdAt,
            // Ensure location has lat/lng, provide defaults if necessary (though issues should always have them)
            location: data.location ? { 
              lat: data.location.latitude ?? 0, 
              lng: data.location.longitude ?? 0,
              address: data.locationAddress
            } : { lat: 0, lng: 0 },
          } as Issue;
        });
        setRecentIssues(fetchedIssues);
      } catch (error) {
        console.error("Error fetching recent issues for AR view:", error);
        setErrorLoadingIssues("Could not load nearby issues. Please try again later.");
      } finally {
        setIsLoadingIssues(false);
      }
    };
    fetchRecentIssues();
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="font-headline">AR Field View</CardTitle>
          <CardDescription>Live camera feed with data overlays. (Conceptual)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border border-dashed p-4">
            <Image 
              src="https://placehold.co/600x338.png?text=AR+Field+View+Interface" 
              alt="AR Field View Placeholder" 
              width={600} 
              height={338} 
              className="max-w-full h-auto opacity-60 rounded-md"
              data-ai-hint="worker field"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Simulated AR view: Overlays for issues, infrastructure, and instructions.
            </p>
          </div>
          <div className="mt-4 text-xs text-muted-foreground text-center p-2 border rounded-md bg-secondary/50">
            <Eye className="h-5 w-5 mx-auto mb-1 text-primary" />
            <strong>AR Feature:</strong>
            <p>Department officials use AR to view overlays of city data (issue locations, infrastructure details like pipes, cables). Access historical data, maintenance records, and step-by-step repair instructions directly in their field of vision.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled> {/* AR activation would require native device features */}
            <HardHat className="mr-2 h-4 w-4" /> Activate AR Field Mode (Concept)
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4 md:col-span-1">
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Nearby Active Issues</CardTitle>
            <CardDescription>Recently reported or active issues.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {isLoadingIssues ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p>Loading nearby issues...</p>
              </div>
            ) : errorLoadingIssues ? (
              <div className="py-6 text-center text-destructive">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                <p>{errorLoadingIssues}</p>
              </div>
            ) : recentIssues.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No active issues found nearby.</p>
            ) : (
              recentIssues.map(issue => (
                <div key={issue.id} className="p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm truncate pr-2" title={issue.title}>{issue.title}</h4>
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1" />{issue.locationAddress || (issue.location ? `${issue.location.lat.toFixed(3)}, ${issue.location.lng.toFixed(3)}` : 'Unknown location')}</p>
                  <p className="text-xs">Status: <span className="font-medium">{issue.status}</span> ({formatDistanceToNowStrict(parseISO(issue.createdAt), { addSuffix: true })})</p>
                  <p className="text-xs mt-1 line-clamp-2">{issue.description}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
                     <Link href={`/issues/${issue.id}`}>View Details</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
