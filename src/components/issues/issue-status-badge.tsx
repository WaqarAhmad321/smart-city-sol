import { Badge } from "@/components/ui/badge";
import type { IssueStatus } from "@/types";

interface IssueStatusBadgeProps {
  status: IssueStatus;
}

export function IssueStatusBadge({ status }: IssueStatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let className = "";

  switch (status) {
    case "Pending":
      variant = "outline";
      className = "border-yellow-500 text-yellow-600";
      break;
    case "Assigned":
      variant = "outline";
      className = "border-blue-500 text-blue-600";
      break;
    case "In Progress":
      variant = "default"; // Uses primary theme color (soft green)
      className = "bg-primary/20 text-primary";
      break;
    case "Resolved":
      variant = "secondary";
      className = "bg-green-100 text-green-700 border-green-300";
      break;
    case "Closed":
      variant = "secondary";
      className = "text-muted-foreground";
      break;
    default:
      variant = "outline";
  }

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {status}
    </Badge>
  );
}

// Helper cn function if not globally available (it is in this project via lib/utils)
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
