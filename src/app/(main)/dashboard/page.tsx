"use client";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ReportForm } from "@/components/dashboard/report-form";
import {
  DepartmentPerformanceChart,
  IssueStatusChart,
  IssuesOverTimeChart,
} from "@/components/dashboard/sample-charts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import type { Issue, Proposal, User } from "@/types";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { Download, Filter, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface DashboardData {
  totalIssues: number;
  pendingIssues: number;
  resolvedIssuesLast30Days: number;
  totalProposals: number;
  totalUsers: number;
  issuesForStatusChart: Issue[];
  issuesForOverTimeChart: Issue[];
  issuesForDepartmentChart: Issue[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const issuesQuery = query(
          collection(db, "issues"),
          orderBy("createdAt", "desc"),
        );
        const proposalsQuery = query(
          collection(db, "proposals"),
          orderBy("createdAt", "desc"),
        );
        const usersQuery = query(collection(db, "users"));

        const [issuesSnapshot, proposalsSnapshot, usersSnapshot] =
          await Promise.all([
            getDocs(issuesQuery),
            getDocs(proposalsQuery),
            getDocs(usersQuery),
          ]);

        const allIssues: Issue[] = issuesSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Ensure timestamps are correctly converted
          const createdAt =
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : typeof data.createdAt === "string"
                ? data.createdAt
                : new Date().toISOString();
          const updatedAt =
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate().toISOString()
              : typeof data.updatedAt === "string"
                ? data.updatedAt
                : new Date().toISOString();

          return {
            id: doc.id,
            ...data,
            createdAt,
            updatedAt,
          } as Issue;
        });

        const totalIssues = allIssues.length;
        const pendingIssues = allIssues.filter(
          (issue) => issue.status === "Pending",
        ).length;

        const thirtyDaysAgo = subDays(new Date(), 30);
        const resolvedIssuesLast30Days = allIssues.filter((issue) => {
          try {
            return (
              issue.status === "Resolved" &&
              parseISO(issue.updatedAt) >= thirtyDaysAgo
            );
          } catch (e) {
            console.warn(
              `Invalid date format for issue ${issue.id} updatedAt: ${issue.updatedAt}`,
            );
            return false;
          }
        }).length;

        const totalProposals = proposalsSnapshot.size;
        const totalUsers = usersSnapshot.size;

        setDashboardData({
          totalIssues,
          pendingIssues,
          resolvedIssuesLast30Days,
          totalProposals,
          totalUsers,
          issuesForStatusChart: [...allIssues],
          issuesForOverTimeChart: [...allIssues],
          issuesForDepartmentChart: [...allIssues],
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={<Skeleton className="h-8 w-48" />}
          description={<Skeleton className="h-4 w-72" />}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28" />{" "}
            <Skeleton className="h-10 w-32" />
          </div>
        </PageHeader>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-lg" />{" "}
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
        <Skeleton className="h-60 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center py-12 text-destructive bg-destructive/10 p-6 rounded-lg">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error Loading Dashboard</p>
        <p>{error || "Could not load data."}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const kpis: { label: string; value: string | number; unit?: string }[] = [
    { label: "Total Issues Reported", value: dashboardData.totalIssues },
    { label: "Pending Issues", value: dashboardData.pendingIssues },
    {
      label: "Resolved (Last 30d)",
      value: dashboardData.resolvedIssuesLast30Days,
    },
    { label: "Active Proposals", value: dashboardData.totalProposals },
    { label: "Registered Users", value: dashboardData.totalUsers },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of city operations and performance."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Filter className="mr-2 h-4 w-4" />
            Filter Data
          </Button>
          <Button disabled>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </PageHeader>

      <section aria-labelledby="kpi-title">
        <h2 id="kpi-title" className="sr-only">
          Key Performance Indicators
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="charts-title"
        className="grid gap-6 md:grid-cols-2"
      >
        <h2 id="charts-title" className="sr-only">
          Data Visualizations
        </h2>
        <IssuesOverTimeChart issues={dashboardData.issuesForOverTimeChart} />
        <IssueStatusChart issues={dashboardData.issuesForStatusChart} />
      </section>

      <section aria-labelledby="department-performance-title">
        <h2
          id="department-performance-title"
          className="text-xl font-semibold mb-4 font-headline"
        >
          Department Performance
        </h2>
        <DepartmentPerformanceChart
          issues={dashboardData.issuesForDepartmentChart}
        />
      </section>

      {/* <section aria-labelledby="report-generation-title"> */}
      {/*   <h2 id="report-generation-title" className="text-xl font-semibold mb-4 font-headline">Custom Report Generation</h2> */}
      {/*   <ReportForm /> */}
      {/* </section> */}
    </div>
  );
}

const KpiCardSkeleton = () => (
  <Card className="shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-2/5 mb-1" />
      <Skeleton className="h-3 w-4/5" />
    </CardContent>
  </Card>
);
