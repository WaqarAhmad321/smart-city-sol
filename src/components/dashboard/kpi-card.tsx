
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KPIData } from "@/types"; // KPIData can be simplified if previousValue/change not used
import { ArrowDownRight, ArrowUpRight, TrendingUp, ListChecks, Users, Vote, AlertCircle } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  previousValue?: string | number; // Optional, as we might not have it from basic Firebase queries
  change?: number; // Optional
}

// Icon mapping based on label keywords
const getIconForLabel = (label: string) => {
  if (label.toLowerCase().includes("issue")) return <ListChecks className="h-4 w-4 text-muted-foreground" />;
  if (label.toLowerCase().includes("user")) return <Users className="h-4 w-4 text-muted-foreground" />;
  if (label.toLowerCase().includes("proposal")) return <Vote className="h-4 w-4 text-muted-foreground" />;
  if (label.toLowerCase().includes("pending")) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
}


export function KpiCard({ label, value, previousValue, unit, change }: KpiCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number' && Number.isInteger(val)) {
      return val.toLocaleString();
    }
    if (typeof val === 'number') {
      return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }); // Adjusted for cleaner display
    }
    return val;
  };
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {getIconForLabel(label)}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}{unit && <span className="text-xs font-normal ml-1">{unit}</span>}</div>
        {change !== undefined && previousValue !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center">
            {change >= 0 ? <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /> : <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
            {change.toFixed(1)}% from {formatValue(previousValue)} {unit && <span className="ml-1">{unit}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
