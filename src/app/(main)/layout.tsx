
"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton"; 

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login'); // Redirect to login page if not authenticated
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="space-y-6">
            <div className="mb-6 md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-10 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-10 w-24 mt-4 md:mt-0" />
            </div>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
         <div className="flex flex-col items-center justify-center h-screen text-center bg-background">
            <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium text-muted-foreground">Redirecting to login...</p>
            <p className="text-sm text-muted-foreground">Please wait while we verify your session.</p>
        </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
