
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { db, storage } from "@/lib/firebase"; // Added storage
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage, User, ChatRoom } from "@/types";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, Timestamp, limit } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase Storage imports
import { Paperclip, SendHorizonal, Smile, MessageCircle, Image as ImageIcon, FileText, X } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { fileToDataUri } from "@/lib/utils";

function getChatRoomId(uid1: string, uid2: string): string {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export function ChatLayout() {
  const { currentUser, currentUserProfile } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [selectedChatPartner, setSelectedChatPartner] = useState<User | null>(null);
  const [currentChatRoomId, setCurrentChatRoomId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    setIsLoadingUsers(true);
    const usersQuery = query(collection(db, "users"), where("id", "!=", currentUser.uid));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => doc.data() as User);
      setUsers(fetchedUsers);
      setIsLoadingUsers(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Could not load contacts.", variant: "destructive" });
      setIsLoadingUsers(false);
    });
    return () => unsubscribe();
  }, [currentUser, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); // Changed to auto for less jarring scroll on load
  }, [messages]);

  useEffect(() => {
    if (!currentUser || !selectedChatPartner) {
      setMessages([]);
      setCurrentChatRoomId(null);
      return;
    }

    const chatRoomId = getChatRoomId(currentUser.uid, selectedChatPartner.id);
    setCurrentChatRoomId(chatRoomId);
    setIsLoadingMessages(true);

    const messagesQuery = query(
      collection(db, "chatRooms", chatRoomId, "messages"),
      orderBy("timestamp", "asc"),
      limit(50) 
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as ChatMessage));
      setMessages(fetchedMessages);
      setIsLoadingMessages(false);
      // Scroll to bottom after messages are loaded/updated
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, (error) => {
      console.error(`Error fetching messages for chat ${chatRoomId}:`, error);
      toast({ title: "Error", description: "Could not load messages.", variant: "destructive" });
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedChatPartner, toast]);

  const handleSelectChatPartner = async (partner: User) => {
    if (!currentUser || !currentUserProfile) return;
    setSelectedChatPartner(partner);
    setAttachmentFile(null);
    setAttachmentPreview(null);
    
    const chatRoomId = getChatRoomId(currentUser.uid, partner.id);
    const chatRoomRef = doc(db, "chatRooms", chatRoomId);
    const chatRoomSnap = await getDoc(chatRoomRef);

    if (!chatRoomSnap.exists()) {
      try {
        await setDoc(chatRoomRef, {
          memberIds: [currentUser.uid, partner.id],
          memberInfo: {
            [currentUser.uid]: { name: currentUserProfile.name, avatarUrl: currentUserProfile.avatarUrl },
            [partner.id]: { name: partner.name, avatarUrl: partner.avatarUrl },
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error creating chat room:", error);
        toast({ title: "Error", description: "Could not initialize chat.", variant: "destructive"});
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select a file smaller than 5MB.", variant: "destructive" });
        return;
      }
      setAttachmentFile(file);
      if (file.type.startsWith("image/")) {
        const dataUri = await fileToDataUri(file);
        setAttachmentPreview(dataUri);
      } else {
        setAttachmentPreview(null); // No preview for non-images
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachmentFile) || !currentUser || !selectedChatPartner || !currentChatRoomId || !currentUserProfile) return;

    setIsUploading(true);

    let fileUrl: string | undefined = undefined;
    let fileType: string | undefined = undefined;

    if (attachmentFile) {
      try {
        const uniqueFileName = `${Date.now()}_${attachmentFile.name}`;
        const fileStorageRef = storageRef(storage, `chatAttachments/${currentChatRoomId}/${uniqueFileName}`);
        await uploadBytes(fileStorageRef, attachmentFile);
        fileUrl = await getDownloadURL(fileStorageRef);
        fileType = attachmentFile.type;
      } catch (error) {
        console.error("Error uploading attachment:", error);
        toast({ title: "Attachment Error", description: "Could not upload file.", variant: "destructive" });
        setIsUploading(false);
        return;
      }
    }

    const messageData: Partial<ChatMessage> = {
      chatRoomId: currentChatRoomId,
      senderId: currentUser.uid,
      senderName: currentUserProfile.name,
      senderAvatar: currentUserProfile.avatarUrl,
      content: newMessage.trim(),
      timestamp: serverTimestamp(),
      ...(fileUrl && { attachmentUrl: fileUrl }),
      ...(fileType && { attachmentType: fileType }),
    };

    try {
      await addDoc(collection(db, "chatRooms", currentChatRoomId, "messages"), messageData);
      
      const chatRoomRef = doc(db, "chatRooms", currentChatRoomId);
      await setDoc(chatRoomRef, {
        lastMessageText: newMessage.trim() || (attachmentFile ? attachmentFile.name : "Attachment"),
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: currentUser.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setNewMessage("");
      setAttachmentFile(null);
      setAttachmentPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };
  
  const getSenderDetails = (senderId: string) => {
    if (!currentUser || !selectedChatPartner || !currentUserProfile) return { name: 'User', avatarUrl: '' };
    if (senderId === currentUser.uid) return { name: currentUserProfile.name, avatarUrl: currentUserProfile.avatarUrl };
    if (senderId === selectedChatPartner.id) return { name: selectedChatPartner.name, avatarUrl: selectedChatPartner.avatarUrl };
    return { name: 'Unknown', avatarUrl: '' };
  }

  return (
    <div className="flex h-full border rounded-lg bg-card">
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <Input placeholder="Search contacts..." disabled />
        </div>
        <ScrollArea className="h-[calc(100%-65px)]">
          {isLoadingUsers ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center p-4 space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">No other users found.</p>
          ) : (
            users.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className={`w-full justify-start p-4 h-auto rounded-none ${selectedChatPartner?.id === user.id ? 'bg-accent text-accent-foreground' : ''}`}
                onClick={() => handleSelectChatPartner(user)}
              >
                <Avatar className="mr-3">
                  <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar"/>
                  <AvatarFallback>{user.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </Button>
            ))
          )}
        </ScrollArea>
      </div>

      <div className="w-2/3 flex flex-col">
        {selectedChatPartner && currentUser ? (
          <>
            <div className="p-4 border-b flex items-center">
              <Avatar className="mr-3">
                 <AvatarImage src={selectedChatPartner.avatarUrl} alt={selectedChatPartner.name} data-ai-hint="user avatar"/>
                <AvatarFallback>{selectedChatPartner.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedChatPartner.name}</p>
              </div>
            </div>
            <ScrollArea className="flex-grow p-4 space-y-4 bg-muted/20">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Skeleton className="h-8 w-8 animate-pulse rounded-full" /> <p className="ml-2 text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages.length === 0 && !attachmentPreview ? (
                <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                    <MessageCircle className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No messages yet.</p>
                    <p>Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCurrentUserSender = msg.senderId === currentUser.uid;
                  const senderDetails = getSenderDetails(msg.senderId);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCurrentUserSender ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[70%]`}>
                        {!isCurrentUserSender && (
                          <Avatar className="h-6 w-6 self-end">
                             <AvatarImage src={senderDetails.avatarUrl} alt={senderDetails.name} data-ai-hint="user avatar"/>
                            <AvatarFallback>{senderDetails.name?.substring(0,1).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`p-3 rounded-lg shadow-sm ${
                            isCurrentUserSender
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-background text-foreground border rounded-bl-none"
                          }`}
                        >
                          {msg.attachmentUrl && msg.attachmentType?.startsWith("image/") && (
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mb-1 max-w-xs max-h-64 overflow-hidden rounded">
                              <Image src={msg.attachmentUrl} alt="Chat attachment" width={200} height={150} className="object-contain" data-ai-hint="chat image"/>
                            </a>
                          )}
                           {msg.attachmentUrl && !msg.attachmentType?.startsWith("image/") && (
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 mb-1 bg-background/20 rounded hover:bg-background/40">
                              <FileText className="h-5 w-5 mr-2"/>
                              <span className="text-sm underline truncate">{msg.content || new URL(msg.attachmentUrl).pathname.split('/').pop() || "View File"}</span>
                            </a>
                          )}
                          {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                           <p className="text-xs opacity-70 mt-1 text-right">
                             {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                           </p>
                        </div>
                         {isCurrentUserSender && (
                          <Avatar className="h-6 w-6 self-end">
                             <AvatarImage src={senderDetails.avatarUrl} alt={senderDetails.name} data-ai-hint="user avatar"/>
                            <AvatarFallback>{senderDetails.name?.substring(0,1).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
            {attachmentPreview && (
              <div className="p-2 border-t bg-background flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <Image src={attachmentPreview} alt="Preview" width={40} height={40} className="rounded object-cover" data-ai-hint="upload preview" />
                  <span className="text-sm text-muted-foreground truncate max-w-xs">{attachmentFile?.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setAttachmentFile(null); setAttachmentPreview(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2 bg-background">
              <Button variant="ghost" size="icon" type="button" disabled><Smile className="h-5 w-5 text-muted-foreground" /></Button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="chat-file-input" accept="image/*,application/pdf,.doc,.docx,.txt"/>
              <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow"
                autoComplete="off"
                disabled={isLoadingMessages || isUploading}
              />
              <Button type="submit" size="icon" disabled={(!newMessage.trim() && !attachmentFile) || isLoadingMessages || isUploading}>
                <SendHorizonal className="h-5 w-5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="w-24 h-24 mb-6 opacity-50" />
            <p className="text-xl font-medium">Select a chat to start messaging</p>
            <p>Or, if no contacts appear, wait for users to sign up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
