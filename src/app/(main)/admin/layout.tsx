"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUserProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      !loading &&
      (!currentUserProfile || currentUserProfile.role !== "admin")
    ) {
      console.warn(
        "Access Denied: User is not an admin or profile not loaded.",
        currentUserProfile,
      );
      router.push("/dashboard"); // Redirect to dashboard or a specific 'access-denied' page
    }
  }, [currentUserProfile, loading, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={<Skeleton className="h-8 w-48" />}
          description={<Skeleton className="h-4 w-72" />}
        />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center bg-destructive/10 p-6 rounded-lg">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive font-headline">
          Access Denied
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          You do not have permission to view this page.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="mt-6">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
