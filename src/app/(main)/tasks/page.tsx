import { PageHeader } from "@/components/common/page-header";
import { TaskAssignmentForm } from "@/components/tasks/task-assignment-form";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Department Task Automation" 
        description="Manage automated task assignments and escalations."
      />
      <TaskAssignmentForm />
      {/* Placeholder for displaying task statuses or logs */}
      <div className="p-6 border rounded-lg bg-card shadow-sm">
        <h2 className="text-xl font-semibold mb-4 font-headline">Task Log (Conceptual)</h2>
        <p className="text-muted-foreground">
          This area would display logs of automated task assignments, escalations, and their statuses.
          For example, "Field worker auto-assigned to 'Downtown Area' due to high issue volume."
          or "Issue #123 'Unresolved Pothole' auto-escalated to supervisor."
        </p>
      </div>
    </div>
  );
}
