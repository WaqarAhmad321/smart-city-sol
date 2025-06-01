import type { Issue } from "@/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IssueStatusBadge } from "./issue-status-badge";
import { Eye, Edit3 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

interface IssueListItemProps {
  issue: Issue;
}

export function IssueListItem({ issue }: IssueListItemProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{issue.title}</TableCell>
      <TableCell>{issue.category}</TableCell>
      <TableCell>
        <IssueStatusBadge status={issue.status} />
      </TableCell>
      <TableCell>{issue.createdAt ? formatDistanceToNowStrict(new Date(issue.createdAt), { addSuffix: true }) : 'N/A'}</TableCell>
      <TableCell>{issue.location.address || `${issue.location.lat.toFixed(3)}, ${issue.location.lng.toFixed(3)}`}</TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/issues/${issue.id}`}>
            <Eye className="mr-1 h-3.5 w-3.5" /> View
          </Link>
        </Button>
        {/* Placeholder for edit functionality, might be admin-only or reporter-only */}
        {/* <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
        </Button> */}
      </TableCell>
    </TableRow>
  );
}
