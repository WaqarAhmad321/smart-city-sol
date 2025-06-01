
"use client";
import { PageHeader } from "@/components/common/page-header";
import { CreateProposalForm } from "@/components/polling/create-proposal-form";
import { ProposalCard } from "@/components/polling/proposal-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { db } from "@/lib/firebase";
import type { Proposal } from "@/types";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { PlusCircle, AlertTriangle, VoteIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function PollingPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUserProfile } = useAuth(); 

  const isAdmin = currentUserProfile?.role === 'admin'; 

  const fetchProposals = () => {
    setIsLoading(true);
    const q = query(collection(db, "proposals"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedProposals: Proposal[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedProposals.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          votingDeadline: (data.votingDeadline as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as Proposal);
      });
      setProposals(fetchedProposals);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching proposals:", err);
      setError("Failed to load proposals. Please try again.");
      setIsLoading(false);
    });

    return unsubscribe; 
  };
  
  useEffect(() => {
    const unsubscribe = fetchProposals();
    return () => unsubscribe(); 
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Public Polling" description="Participate in city improvement proposals.">
        {isAdmin && (
          <CreateProposalForm 
            triggerButton={<Button><PlusCircle className="mr-2 h-4 w-4" /> Create Proposal</Button>} 
            onProposalCreated={fetchProposals} 
          />
        )}
      </PageHeader>
      
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} <Button variant="link" onClick={fetchProposals}>Try Again</Button></AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && proposals.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {!isLoading && !error && proposals.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <VoteIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-semibold">No active proposals at the moment.</p>
          <p className="text-muted-foreground">
            {isAdmin ? "Create a new proposal to get started!" : "Check back soon or contact your city officials to suggest new ideas!"}
          </p>
        </div>
      )}
    </div>
  );
}

const CardSkeleton = () => (
  <div className="space-y-3 p-4 border rounded-lg bg-card">
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

