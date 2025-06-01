"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { Issue, IssueStatus } from "@/types";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { createNotification } from "@/lib/notifications";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { mockDepartments } from "@/lib/placeholder-data";

interface IssueManagementActionsProps {
  initialIssue: Issue;
}

export function IssueManagementActions({
  initialIssue,
}: IssueManagementActionsProps) {
  const { currentUserProfile } = useAuth();
  const { toast } = useToast();

  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editableStatus, setEditableStatus] = useState<IssueStatus | undefined>(
    initialIssue.status,
  );
  const [editableAssignedTo, setEditableAssignedTo] = useState<
    string | undefined
  >(initialIssue.assignedTo || "");

  // Effect to sync local state if initialIssue prop changes (e.g., parent re-fetches)
  useEffect(() => {
    setIssue(initialIssue);
    setEditableStatus(initialIssue.status);
    setEditableAssignedTo(initialIssue.assignedTo || "");
  }, [initialIssue]);

  const userCanManageIssue =
    currentUserProfile &&
    (currentUserProfile.role === "admin" ||
      currentUserProfile.role === "official");

  const handleUpdateIssue = async () => {
    if (!userCanManageIssue || !currentUserProfile) {
      toast({
        title: "Unauthorized",
        description: "You do not have permission to manage this issue.",
        variant: "destructive",
      });
      return;
    }

    const hasStatusChanged = editableStatus && editableStatus !== issue.status;
    const hasAssignmentChanged =
      editableAssignedTo !== undefined &&
      editableAssignedTo !== (issue.assignedTo || "");

    if (!hasStatusChanged && !hasAssignmentChanged) {
      toast({
        title: "No Changes",
        description: "No changes were made to the issue.",
      });
      return;
    }

    const updates: any = { updatedAt: serverTimestamp() };
    let notificationMessage = "";
    let notificationType: Parameters<typeof createNotification>[0]["type"] =
      "issue_update"; // Default type

    if (hasStatusChanged) {
      updates.status = editableStatus;
      notificationMessage = `Status of your reported issue "${issue.title}" changed to ${editableStatus}.`;
    }
    if (hasAssignmentChanged) {
      updates.assignedTo =
        editableAssignedTo === "" ? null : editableAssignedTo; // Store null if unassigned
      const deptName =
        mockDepartments.find((d) => d.id === editableAssignedTo)?.name ||
        editableAssignedTo ||
        "Unassigned";
      const assignmentMessage = `Issue "${issue.title}" has been assigned to ${deptName}.`;
      if (notificationMessage) {
        notificationMessage += ` ${assignmentMessage}`;
      } else {
        notificationMessage = assignmentMessage;
        notificationType = "issue_assigned";
      }
    }

    setIsUpdating(true);
    try {
      const issueRef = doc(db, "issues", issue.id);
      await updateDoc(issueRef, updates);

      setIssue((prev) => ({
        ...prev,
        status: updates.status !== undefined ? updates.status : prev.status,
        assignedTo:
          updates.assignedTo === null
            ? undefined
            : updates.assignedTo !== undefined
              ? updates.assignedTo
              : prev.assignedTo,
        updatedAt: new Date().toISOString(),
      }));

      toast({
        title: "Issue Updated",
        description: "The issue details have been successfully updated.",
      });

      if (issue.reportedBy && notificationMessage && currentUserProfile) {
        await createNotification({
          userId: issue.reportedBy,
          message: notificationMessage,
          type: notificationType,
          link: `/issues/${issue.id}`,
          relatedEntityId: issue.id,
          createdBy: currentUserProfile.id,
        });
      }
    } catch (err) {
      console.error("Error updating issue:", err);
      toast({
        title: "Update Failed",
        description: "Could not update issue details.",
        variant: "destructive",
      });
      // Optionally revert local state if Firestore update fails, though current setup keeps new values
      // setEditableStatus(issue.status);
      // setEditableAssignedTo(issue.assignedTo || "");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!userCanManageIssue) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Manage Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`issue-status-select-${issue.id}`}>
            Update Status
          </Label>
          <Select
            value={editableStatus}
            onValueChange={(value) => setEditableStatus(value as IssueStatus)}
            disabled={isUpdating}
          >
            <SelectTrigger id={`issue-status-select-${issue.id}`}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {(
                [
                  "Pending",
                  "Assigned",
                  "In Progress",
                  "Resolved",
                  "Closed",
                ] as IssueStatus[]
              ).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`issue-assign-select-${issue.id}`}>
            Assign to Department
          </Label>
          <Select
            value={editableAssignedTo}
            onValueChange={(value) =>
              setEditableAssignedTo(value === "unassign" ? "" : value)
            }
            disabled={isUpdating}
          >
            <SelectTrigger id={`issue-assign-select-${issue.id}`}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassign">Unassign</SelectItem>
              {mockDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
              {issue.assignedTo &&
                !mockDepartments.find((d) => d.id === issue.assignedTo) && (
                  <SelectItem value={issue.assignedTo} disabled>
                    {issue.assignedTo} (Custom/Legacy)
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleUpdateIssue}
          disabled={
            isUpdating ||
            (editableStatus === issue.status &&
              editableAssignedTo === (issue.assignedTo || ""))
          }
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
