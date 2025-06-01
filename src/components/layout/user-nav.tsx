
"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, Settings, User as UserIcon, ShieldCheck, Bell, CheckCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp, limit } from "firebase/firestore";
import type { Notification as NotificationType } from "@/types";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function NotificationItem({ notification, onRead }: { notification: NotificationType, onRead: (id: string) => void }) {
  const getIcon = () => {
    switch (notification.type) {
      case "issue_update": return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "new_proposal": return <Vote className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };
  return (
    <DropdownMenuItem 
      className={cn("flex flex-col items-start gap-1 p-2.5 data-[highlighted]:bg-accent/80", !notification.isRead && "bg-primary/5 hover:bg-primary/10")}
      onClick={() => { if(!notification.isRead) onRead(notification.id); }}
      asChild={!!notification.link}
    >
      {notification.link ? (
        <Link href={notification.link} className="w-full">
          <div className="flex items-start gap-2">
            {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"></div>}
            {getIcon()}
            <p className="text-sm leading-snug flex-grow whitespace-normal">{notification.message}</p>
          </div>
          <p className="text-xs text-muted-foreground self-end mt-1">
            {notification.createdAt ? formatDistanceToNowStrict(new Date(notification.createdAt as string), { addSuffix: true }) : 'just now'}
          </p>
        </Link>
      ) : (
         <>
          <div className="flex items-start gap-2 w-full">
            {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"></div>}
            {getIcon()}
            <p className="text-sm leading-snug flex-grow whitespace-normal">{notification.message}</p>
          </div>
          <p className="text-xs text-muted-foreground self-end mt-1">
            {notification.createdAt ? formatDistanceToNowStrict(new Date(notification.createdAt as string), { addSuffix: true }) : 'just now'}
          </p>
        </>
      )}
    </DropdownMenuItem>
  );
}


export function UserNav() {
  const { currentUser, currentUserProfile, signInWithGoogle, signOut, loading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoadingNotifications(false);
      return;
    }

    setIsLoadingNotifications(true);
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(10) // Limit to last 10 notifications
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as NotificationType));
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
      setIsLoadingNotifications(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setIsLoadingNotifications(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleMarkAsRead = async (notificationId: string) => {
    const notifRef = doc(db, "notifications", notificationId);
    try {
      await updateDoc(notifRef, { isRead: true });
      // Optimistic update handled by onSnapshot
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    // For simplicity, update one by one. In a real app, use batch writes for > few updates.
    try {
      for (const notif of unreadNotifications) {
        const notifRef = doc(db, "notifications", notif.id);
        await updateDoc(notifRef, { isRead: true });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };


  if (loading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!currentUser || !currentUserProfile) {
    return (
      <Button onClick={signInWithGoogle} variant="outline">
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    );
  }
  

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-3 border-b">
            <DropdownMenuLabel className="p-0 text-base font-semibold">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleMarkAllAsRead}>
                    <CheckCheck className="mr-1 h-3 w-3"/> Mark all as read
                </Button>
            )}
          </div>
          <ScrollArea className="max-h-96">
            {isLoadingNotifications ? (
              <DropdownMenuItem disabled className="justify-center p-4">Loading...</DropdownMenuItem>
            ) : notifications.length === 0 ? (
              <DropdownMenuItem disabled className="justify-center text-muted-foreground p-4">No new notifications</DropdownMenuItem>
            ) : (
              notifications.map(notif => (
                <NotificationItem key={notif.id} notification={notif} onRead={handleMarkAsRead} />
              ))
            )}
          </ScrollArea>
           {notifications.length > 0 && ( // Example "View All" link
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="justify-center">
                <Link href="/notifications" className="text-sm text-primary hover:underline">View all notifications (Concept)</Link>
              </DropdownMenuItem>
            </>
           )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUserProfile.avatarUrl || currentUser.photoURL || undefined} alt={currentUserProfile.name || "User"} data-ai-hint="user avatar"/>
              <AvatarFallback>{currentUserProfile.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{currentUserProfile.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUserProfile.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground capitalize pt-1 flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1 text-primary"/> Role: {currentUserProfile.role}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
