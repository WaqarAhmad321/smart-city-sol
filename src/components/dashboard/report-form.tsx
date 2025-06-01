
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const reportFormSchema = z.object({
  reportType: z.string().min(1, "Report type is required."),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }),
  metrics: z.array(z.string()).min(1, "At least one metric must be selected."),
  department: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const availableMetrics = [
  { id: "issue_count", label: "Total Issue Count" },
  { id: "resolution_time", label: "Average Resolution Time" },
  { id: "citizen_engagement", label: "Citizen Engagement Score" },
  { id: "department_response", label: "Department Response Rate" },
];

const availableDepartments = [
  { id: "public_works", label: "Public Works" },
  { id: "parks_rec", label: "Parks & Recreation" },
  { id: "transportation", label: "Transportation" },
];

export function ReportForm() {
  const { toast } = useToast();
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: "",
      dateRange: { from: undefined, to: undefined },
      metrics: [],
      department: "",
    },
  });

  function onSubmit(data: ReportFormValues) {
    console.log("Generating report with data:", data);
    // Simulate report generation
    toast({
      title: "Report Generation Started",
      description: `Your ${data.reportType} report is being generated.`,
    });
    form.reset();
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Generate Custom Report</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a report type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="issue_summary">Issue Summary</SelectItem>
                      <SelectItem value="performance_overview">Performance Overview</SelectItem>
                      <SelectItem value="department_activity">Department Activity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateRange.from" // Simplified for single date picker, can be extended to date range picker
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Range (Start)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a start date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             {/* Add a similar FormField for dateRange.to for a full date range */}

            <FormField
              control={form.control}
              name="metrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metrics to Include</FormLabel>
                   <Select onValueChange={(value) => field.onChange([...(field.value || []), value])} >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select metrics (can select multiple conceptually)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableMetrics.map(metric => (
                        <SelectItem key={metric.id} value={metric.id}>{metric.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Selected: {field.value?.join(', ') || 'None'}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value === "" ? "all_departments" : field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all_departments">All Departments</SelectItem>
                      {availableDepartments.map(dept => (
                         <SelectItem key={dept.id} value={dept.id}>{dept.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              <Download className="mr-2 h-4 w-4" /> Generate Report
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
