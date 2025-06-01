import { PageHeader } from "@/components/common/page-header";
import { ChatLayout } from "@/components/communication/chat-layout";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

export default function CommunicationPage() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Communication Hub" description="Connect with city officials and other citizens.">
        <Button>
            <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </PageHeader>
      <div className="flex-grow rounded-lg overflow-hidden shadow-lg">
        <ChatLayout />
      </div>
    </div>
  );
}
