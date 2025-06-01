
"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { mockDepartments } from "@/lib/placeholder-data"; // Keep for department name mapping
import type { Issue } from "@/types";
import { subDays, format, startOfDay, parseISO } from "date-fns";
import { useMemo } from "react";

const issueStatusColors: Record<string, string> = {
  Pending: "hsl(var(--chart-1))",
  Assigned: "hsl(var(--chart-2))",
  "In Progress": "hsl(var(--chart-3))",
  Resolved: "hsl(var(--chart-4))",
  Closed: "hsl(var(--chart-5))",
  Other: "hsl(var(--muted))", // Fallback color
};

const issueStatusChartConfigBase = {
  issues: { label: "Issues" },
};

interface IssueStatusChartProps {
  issues: Issue[];
}

export function IssueStatusChart({ issues }: IssueStatusChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const statusCounts = issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      issues: count,
      fill: issueStatusColors[status] || issueStatusColors.Other,
    }));

    const config: ChartConfig = { ...issueStatusChartConfigBase };
    data.forEach(item => {
      config[item.status] = { label: item.status, color: item.fill };
    });
    
    return { chartData: data, chartConfig: config };
  }, [issues]);


  if (!issues || issues.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Issue Status Distribution</CardTitle>
          <CardDescription>No issue data available to display.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p>No data</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Issue Status Distribution</CardTitle>
        <CardDescription>Current breakdown of issues by status from Firebase.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <ChartTooltipContent nameKey="status" hideLabel />
            <Pie data={chartData} dataKey="issues" nameKey="status" labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {chartData.map((entry) => (
                    <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                ))}
            </Pie>
            <Legend content={({ payload }) => {
                 if (!payload) return null;
                 return (
                    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-4 text-sm">
                    {payload.map((entry, index) => (
                        <li key={`item-${index}`} className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.value} ({/* @ts-ignore */}
                        {chartData.find(cd => cd.status === entry.value)?.issues || 0})
                        </li>
                    ))}
                    </ul>
                 );
            }} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const issuesOverTimeChartConfig = {
  issues: {
    label: "Issues Reported",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface IssuesOverTimeChartProps {
  issues: Issue[];
}
export function IssuesOverTimeChart({ issues }: IssuesOverTimeChartProps) {
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }).map((_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      return {
        date: format(date, "MMM d"),
        isoDate: date.toISOString().split('T')[0], // For matching
        issues: 0,
      };
    });

    issues.forEach(issue => {
      if (issue.createdAt) {
        try {
          const issueDateStr = parseISO(issue.createdAt).toISOString().split('T')[0];
          const dayData = last30Days.find(d => d.isoDate === issueDateStr);
          if (dayData) {
            dayData.issues += 1;
          }
        } catch (e) {
          console.warn("Could not parse issue createdAt date:", issue.createdAt, e);
        }
      }
    });
    return last30Days;
  }, [issues]);
  
  if (!issues) { // No need to check length === 0 here as we prefill last30Days
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Issues Reported Over Time</CardTitle>
          <CardDescription>No issue data available to display.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p>No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Issues Reported Over Time</CardTitle>
        <CardDescription>Number of issues reported in the last 30 days from Firebase.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={issuesOverTimeChartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} margin={{ left: 0, right: 12, top: 5, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} angle={-35} textAnchor="end" height={50} interval="preserveStartEnd"/>
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
            <ChartTooltipContent />
            <Line dataKey="issues" type="monotone" stroke="var(--color-issues)" strokeWidth={2} dot={{r:3}} activeDot={{r:5}}/>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const departmentPerformanceChartColors: Record<string, string> = {
  "Public Works": "hsl(var(--chart-1))",
  "Parks & Recreation": "hsl(var(--chart-2))",
  "Transportation": "hsl(var(--chart-3))",
  "Other Department": "hsl(var(--chart-4))",
};

interface DepartmentPerformanceChartProps {
  issues: Issue[]; // All issues, will be filtered/grouped
}

export function DepartmentPerformanceChart({ issues }: DepartmentPerformanceChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const performanceData: Record<string, { name: string; issuesAssigned: number; issuesResolved: number }> = {};

    mockDepartments.forEach(dept => {
      performanceData[dept.id] = { name: dept.name, issuesAssigned: 0, issuesResolved: 0 };
    });

    issues.forEach(issue => {
      if (issue.assignedTo) {
        const deptId = issue.assignedTo; // Assuming assignedTo is a department ID matching mockDepartments
        if (performanceData[deptId]) {
          performanceData[deptId].issuesAssigned += 1;
          if (issue.status === "Resolved" || issue.status === "Closed") {
            performanceData[deptId].issuesResolved += 1;
          }
        } else {
          // Handle cases where assignedTo might not map to a known department
          // For simplicity, we can create an 'Other' category or ignore
           if (!performanceData["other"]) {
             performanceData["other"] = { name: "Other/Unassigned", issuesAssigned: 0, issuesResolved: 0 };
           }
           performanceData["other"].issuesAssigned += 1;
           if (issue.status === "Resolved" || issue.status === "Closed") {
             performanceData["other"].issuesResolved += 1;
           }
        }
      }
    });
    
    const data = Object.values(performanceData).filter(d => d.issuesAssigned > 0); // Only show depts with issues

    const config: ChartConfig = {};
    data.forEach(dept => {
      config[dept.name] = { // Use department name as key for config
        label: dept.name, 
        color: departmentPerformanceChartColors[dept.name] || departmentPerformanceChartColors["Other Department"]
      };
    });
     config["issuesAssigned"] = {label: "Issues Assigned", color: "hsl(var(--chart-1))"}; // General color
     config["issuesResolved"] = {label: "Issues Resolved", color: "hsl(var(--chart-2))"}; // General color

    return { chartData: data, chartConfig: config };
  }, [issues]);
  
  if (!issues || issues.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Department Performance Metrics</CardTitle>
          <CardDescription>No issue data available to display.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p>No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
       <CardHeader>
        <CardTitle>Department Performance Metrics</CardTitle>
        <CardDescription>Comparison of assigned vs. resolved issues by department (based on mock department mapping).</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" angle={-35} textAnchor="end" height={50} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="issuesAssigned" fill="var(--color-issuesAssigned)" radius={[4, 4, 0, 0]} name="Assigned" />
            <Bar dataKey="issuesResolved" fill="var(--color-issuesResolved)" radius={[4, 4, 0, 0]} name="Resolved" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
