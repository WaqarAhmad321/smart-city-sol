
"use client";

import type { Proposal } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { Clock, Users, CheckCircle, Loader2, Info, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNowStrict, isPast, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, runTransaction, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ProposalCard({ proposal: initialProposal }: { proposal: Proposal }) {
  const [proposal, setProposal] = useState<Proposal>(initialProposal);
  const [selectedOptionIdState, setSelectedOptionIdState] = useState<string | null>(null); // UI selection before confirmation
  const [timeLeft, setTimeLeft] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const isVotingEnded = isPast(new Date(proposal.votingDeadline));
  const userVotedOptionId = currentUser && proposal.voters?.[currentUser.uid];

  useEffect(() => {
    setProposal(initialProposal); 
  }, [initialProposal]);

  useEffect(() => {
    const deadline = new Date(proposal.votingDeadline);
    const updateTimer = () => {
      if (isPast(deadline)) {
        setTimeLeft("Voting ended");
        return;
      }
      setTimeLeft(formatDistanceToNowStrict(deadline, { addSuffix: true }));
    };
    updateTimer();
    const intervalId = setInterval(updateTimer, 60000); 
    return () => clearInterval(intervalId);
  }, [proposal.votingDeadline]);

  const handleVote = async (optionId: string) => {
    if (!currentUser) {
      toast({ title: "Please sign in to vote.", variant: "destructive" });
      return;
    }
    if (isVotingEnded || userVotedOptionId) {
      toast({ title: "Voting not allowed", description: userVotedOptionId ? "You have already voted." : "Voting period has ended.", variant: "destructive"});
      return;
    }

    setIsVoting(true);
    setSelectedOptionIdState(optionId); // Show optimistic selection
    const proposalRef = doc(db, "proposals", proposal.id);

    try {
      await runTransaction(db, async (transaction) => {
        const proposalDoc = await transaction.get(proposalRef);
        if (!proposalDoc.exists()) {
          throw new Error("Proposal does not exist!");
        }
        const currentProposalData = proposalDoc.data() as Proposal;

        if (currentProposalData.voters && currentProposalData.voters[currentUser.uid]) {
          toast({title: "Already Voted", description: "Your vote has already been recorded.", variant: "default"});
          setIsVoting(false);
          setProposal(currentProposalData); 
          return;
        }
        
        const newOptions = currentProposalData.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        
        const newVoters = { ...currentProposalData.voters, [currentUser.uid]: optionId };

        transaction.update(proposalRef, {
          options: newOptions,
          totalVotes: increment(1),
          voters: newVoters,
          updatedAt: serverTimestamp() 
        });
      });

      // Optimistic update might be handled by onSnapshot in parent, or do it here if needed
      // For immediate feedback without waiting for onSnapshot:
      const updatedOptions = proposal.options.map(opt => 
         opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      setProposal(prev => ({
         ...prev,
         options: updatedOptions,
         totalVotes: prev.totalVotes + 1,
         voters: { ...prev.voters, [currentUser.uid!]: optionId }
      }));

      toast({ title: "Vote Cast!", description: "Your vote has been successfully recorded." });
    } catch (error) {
      console.error("Error casting vote:", error);
      toast({ title: "Voting Failed", description: "Could not record your vote. Please try again.", variant: "destructive" });
      setSelectedOptionIdState(null); // Reset optimistic selection on error
    } finally {
      setIsVoting(false);
    }
  };

  const getVotePercentage = (votes: number) => {
    return proposal.totalVotes > 0 ? (votes / proposal.totalVotes) * 100 : 0;
  };

  return (
    <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200">
      {proposal.mediaUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={proposal.mediaUrl}
            alt={proposal.title}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
            data-ai-hint="proposal media"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="font-headline text-xl">{proposal.title}</CardTitle>
        <CardDescription className="text-xs">
          Created by {proposal.createdBy.substring(0,6)}... on {format(new Date(proposal.createdAt), "MMM d, yyyy")}
        </CardDescription>
         {proposal.locationAddress && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <MapPin className="h-3 w-3 mr-1" /> {proposal.locationAddress}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{proposal.description}</p>
        <div className="space-y-3">
          {proposal.options.map((option) => (
            <div key={option.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{option.text}</span>
                {(isVotingEnded || userVotedOptionId) && ( // Show votes/percentage if voting ended or user voted
                  <span className="text-sm text-muted-foreground">
                    {option.votes} votes ({getVotePercentage(option.votes).toFixed(0)}%)
                  </span>
                )}
              </div>
              {isVotingEnded || userVotedOptionId ? (
                 <div className="space-y-1">
                    <Progress 
                        value={getVotePercentage(option.votes)} 
                        aria-label={`${option.text} vote percentage`} 
                        className={cn(userVotedOptionId === option.id && "bg-primary/30 [&>div]:bg-primary")}
                    />
                    {userVotedOptionId === option.id && !isVotingEnded && <p className="text-xs text-primary flex items-center"><CheckCircle className="h-3 w-3 mr-1"/>Your vote</p>}
                 </div>
              ) : (
                <Button
                  variant={selectedOptionIdState === option.id ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting || !!userVotedOptionId} 
                >
                  {isVoting && selectedOptionIdState === option.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedOptionIdState === option.id && !isVoting && <CheckCircle className="mr-2 h-4 w-4" />}
                  {option.text}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-2 border-t pt-4 mt-auto">
        <div className="flex items-center text-sm text-muted-foreground w-full justify-between">
          <span className="flex items-center"><Users className="mr-1.5 h-4 w-4" /> {proposal.totalVotes} Total Votes</span>
          <span className={`flex items-center ${isVotingEnded ? 'text-destructive' : 'text-green-600'}`}>
            <Clock className="mr-1.5 h-4 w-4" /> {timeLeft}
          </span>
        </div>
        {!isVotingEnded && userVotedOptionId && (
          <Alert variant="default" className="w-full p-2 text-sm bg-green-50 border-green-200 text-green-700">
             <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
                You have voted. Results will be fully visible after the deadline if not already.
            </AlertDescription>
          </Alert>
        )}
         {isVotingEnded && (
          <Alert variant="default" className="w-full p-2 text-sm bg-blue-50 border-blue-200 text-blue-700">
             <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
                Voting has ended for this proposal.
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}

