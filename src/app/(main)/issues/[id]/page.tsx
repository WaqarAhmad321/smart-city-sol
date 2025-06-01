import { PageHeader } from "@/components/common/page-header";
import { IssueStatusBadge } from "@/components/issues/issue-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import type { Issue, User as AppUser } from "@/types";
import { doc, getDoc, Timestamp, GeoPoint } from "firebase/firestore";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  MessageSquare,
  MapPin,
  Tag,
  User as UserIconLucide,
  AlertTriangle as AlertTriangleIcon,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IssueManagementActions } from "@/components/issues/issue-management-actions";
import { mockDepartments } from "@/lib/placeholder-data";

interface ReporterProfile
  extends Pick<AppUser, "name" | "avatarUrl" | "email" | "role"> {}

interface IssueFirebase
  extends Omit<
    Issue,
    "createdAt" | "updatedAt" | "location" | "assignedTo" | "id"
  > {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  location: GeoPoint;
  locationAddress?: string;
  reporterName?: string;
  reporterAvatar?: string;
  aiJustification?: string;
  assignedTo?: string;
}

async function getIssueDetails(
  id: string,
): Promise<{ issue: Issue; reporter: ReporterProfile | null } | null> {
  const issueRef = doc(db, "issues", id);
  const issueSnap = await getDoc(issueRef);

  if (!issueSnap.exists()) {
    return null;
  }

  const data = issueSnap.data() as IssueFirebase;
  const fetchedIssue: Issue = {
    id: issueSnap.id, // Ensure ID is part of the Issue type and set here
    title: data.title,
    description: data.description,
    category: data.category,
    status: data.status,
    reportedBy: data.reportedBy,
    reporterName: data.reporterName,
    reporterAvatar: data.reporterAvatar,
    severity: data.severity,
    media: data.media,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    location: {
      lat: data.location.latitude,
      lng: data.location.longitude,
      address:
        data.locationAddress ||
        `${data.location.latitude.toFixed(3)}, ${data.location.longitude.toFixed(3)}`,
    },
    locationAddress: data.locationAddress,
    assignedTo: data.assignedTo,
    aiJustification: data.aiJustification,
  };

  let reporter: ReporterProfile | null = null;
  if (fetchedIssue.reportedBy) {
    if (data.reporterName || data.reporterAvatar) {
      reporter = {
        name: data.reporterName || "Citizen",
        avatarUrl: data.reporterAvatar || undefined,
        email: "",
        role: "citizen",
      };
    } else {
      const userRef = doc(db, "users", fetchedIssue.reportedBy);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        reporter = userSnap.data() as ReporterProfile;
      } else {
        reporter = {
          name: "Citizen (Account Potentially Deleted)",
          avatarUrl: undefined,
          email: "",
          role: "citizen",
        };
      }
    }
  }
  return { issue: fetchedIssue, reporter };
}

export default async function IssueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const issueDetails = await getIssueDetails(params.id);

  if (!issueDetails) {
    notFound();
  }

  const { issue, reporter } = issueDetails;
  const assignedDeptInfo = issue.assignedTo
    ? mockDepartments.find((d) => d.id === issue.assignedTo)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title={issue.title} description={`Issue ID: ${issue.id}`}>
        <Button variant="outline" asChild>
          <Link href="/issues">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Issues
          </Link>
        </Button>
      </PageHeader>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline text-2xl">
                    {issue.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1" />{" "}
                      {issue.location.address ||
                        `${issue.location.lat}, ${issue.location.lng}`}
                    </span>
                    <span className="flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-1" /> {issue.category}
                    </span>
                  </CardDescription>
                </div>
                <IssueStatusBadge status={issue.status} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {issue.description}
              </p>
              {issue.aiJustification && (
                <div className="mt-4 p-3 border rounded-md bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    AI Assessment Justification:
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {issue.aiJustification}
                  </p>
                </div>
              )}
              {issue.media && issue.media.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Attached Media:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {issue.media.map((mediaItem, index) => (
                      <a
                        key={index}
                        href={mediaItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative aspect-video rounded-md overflow-hidden shadow-sm group"
                      >
                        <Image
                          src={mediaItem.url}
                          alt={`Media ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          data-ai-hint="issue attachment"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Last updated: {format(new Date(issue.updatedAt), "PPPp")}
            </CardFooter>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />{" "}
                Communication Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={reporter?.avatarUrl}
                      data-ai-hint="user avatar"
                    />
                    <AvatarFallback>
                      {reporter?.name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {reporter?.name || "Citizen"}
                    </p>
                    <div className="p-2 mt-1 bg-muted rounded-md text-sm">
                      Initial report details are above.
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(issue.createdAt), "PPp")}
                    </p>
                  </div>
                </div>
                <Separator />
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full flex gap-2">
                <Textarea
                  placeholder="Add a comment or update..."
                  className="flex-grow"
                  rows={2}
                  disabled
                />
                <Button disabled>Send</Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-lg">
                Issue Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                <strong>Reported:</strong>
                <span className="ml-auto">
                  {format(new Date(issue.createdAt), "PP")}
                </span>
              </div>
              {reporter && (
                <div className="flex items-center">
                  <UserIconLucide className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong>Reported by:</strong>
                  <span className="ml-auto">{reporter.name}</span>
                </div>
              )}
              <div className="flex items-center">
                {/* <Building className="h-4 w-4 mr-2 text-muted-foreground" /> Removed Building icon as per previous instructions implicitly */}
                <strong>Assigned to:</strong>
                <span className="ml-auto">
                  {assignedDeptInfo?.name ||
                    (issue.assignedTo ? issue.assignedTo : "Unassigned")}
                </span>
              </div>
              {issue.severity && (
                <div className="flex items-center">
                  <AlertTriangleIcon
                    className={`h-4 w-4 mr-2 ${issue.severity === "high" ? "text-destructive" : issue.severity === "medium" ? "text-yellow-500" : "text-green-500"}`}
                  />
                  <strong>Severity:</strong>
                  <Badge
                    variant={
                      issue.severity === "high"
                        ? "destructive"
                        : issue.severity === "medium"
                          ? "default"
                          : "secondary"
                    }
                    className="ml-auto capitalize"
                  >
                    {issue.severity}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <IssueManagementActions initialIssue={issue} />
        </div>
      </div>
    </div>
  );
}
