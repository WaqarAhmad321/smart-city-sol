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
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Loader2, Send, Settings2, Terminal } from "lucide-react";
import { autoAssignFieldWorker, AutoAssignFieldWorkerInput, AutoAssignFieldWorkerOutput } from "@/ai/flows/auto-issue-assigner";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const taskAssignmentSchema = z.object({
  area: z.string().min(3, "Area name must be at least 3 characters."),
  issueThreshold: z.coerce.number().int().positive("Issue threshold must be a positive integer."),
});

type TaskAssignmentFormValues = z.infer<typeof taskAssignmentSchema>;

export function TaskAssignmentForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<AutoAssignFieldWorkerOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<TaskAssignmentFormValues>({
    resolver: zodResolver(taskAssignmentSchema),
    defaultValues: {
      area: "",
      issueThreshold: 5,
    },
  });

  async function onSubmit(data: TaskAssignmentFormValues) {
    setIsLoading(true);
    setAssignmentResult(null);
    try {
      const input: AutoAssignFieldWorkerInput = {
        area: data.area,
        issueThreshold: data.issueThreshold,
      };
      const result = await autoAssignFieldWorker(input);
      setAssignmentResult(result);
      toast({
        title: "Task Automation Complete",
        description: result.assignedWorker 
          ? `Worker ${result.assignedWorker} assigned to ${data.area}. Pending issues: ${result.numPendingIssues}.`
          : `No assignment needed for ${data.area}. Pending issues: ${result.numPendingIssues}.`,
      });
    } catch (error) {
      console.error("Error in task assignment:", error);
      toast({
        title: "Task Automation Failed",
        description: "Could not process the automated assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-lg mx-auto shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary"/> Auto-Assign Field Worker</CardTitle>
        <CardDescription>
          Trigger automatic assignment of a field worker if pending issues in an area exceed a threshold.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geographic Area</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Downtown Sector B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issueThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Threshold</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="E.g., 5" {...field} />
                  </FormControl>
                  <FormDescription>Assign worker if pending issues exceed this number.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Processing...' : 'Run Automation'}
            </Button>
          </CardFooter>
        </form>
      </Form>
      {assignmentResult && (
        <div className="p-4 border-t">
            <Alert variant={assignmentResult.assignedWorker ? "default" : "default"}>
                <Terminal className="h-4 w-4" />
                <AlertTitle className="font-headline">Automation Result for Area: {form.getValues("area")}</AlertTitle>
                <AlertDescription>
                    <p>Pending Issues Found: {assignmentResult.numPendingIssues}</p>
                    {assignmentResult.assignedWorker ? (
                    <p className="text-green-600 font-semibold">Assigned Worker ID: {assignmentResult.assignedWorker}</p>
                    ) : (
                    <p className="text-blue-600 font-semibold">No worker assignment was triggered based on current conditions.</p>
                    )}
                </AlertDescription>
            </Alert>
        </div>
      )}
    </Card>
  );
}
