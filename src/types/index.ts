

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  adminOnly?: boolean; // For admin-specific routes
  officialOnly?: boolean; // For official-specific routes (can combine with admin)
}

export type IssueStatus = "Pending" | "Assigned" | "In Progress" | "Resolved" | "Closed";

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: IssueStatus;
  location: LocationData;
  locationAddress?: string; // Stored address string in Firestore, separate from GeoPoint
  reportedBy: string; // User ID (UID from Firebase Auth)
  reporterName?: string; // Denormalized for easier display
  reporterAvatar?: string; // Denormalized
  assignedTo?: string; // Department ID (e.g., "dept1", "dept2") or descriptive name
  assignedWorkerId?: string; // User ID (UID) of a specific official assigned
  assignedWorkerName?: string; // Denormalized name of the assigned official
  createdAt: string; // ISO Date string (from Firestore Timestamp)
  updatedAt: string; // ISO Date string (from Firestore Timestamp)
  media?: { url: string; type: "image" | "video" }[];
  severity?: "low" | "medium" | "high";
  aiJustification?: string; // From Genkit severity assessment
}

export interface ProposalOption {
  id: string;
  text: string;
  votes: number;
}
export interface Proposal {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  votingDeadline: string;
  options: ProposalOption[];
  mediaUrl?: string;
  mediaType?: "image" | "video";
  totalVotes: number;
  voters?: { [userId: string]: string }; // Key: userId, Value: optionId
  location?: LocationData; // Optional location for proposals
  locationAddress?: string; // Optional address string for proposals
}

export interface Vote {
  id?: string;
  proposalId: string;
  optionId: string;
  userId: string;
  createdAt: string;
}

export type UserRole = "citizen" | "admin" | "official";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string; // ISO Date string or Firestore Timestamp
  isActive?: boolean; // For deactivation
}

export interface Department {
  id: string;
  name: string;
  head?: string; // User ID of department head
}

// Updated ChatMessage for Firestore integration
export interface ChatMessage {
  id: string; // Firestore document ID
  chatRoomId: string; // To identify the chat room this message belongs to
  senderId: string;
  senderName?: string; // Denormalized
  senderAvatar?: string; // Denormalized
  receiverId?: string; // Only if it's a 1-on-1 that isn't part of a structured chat room
  content: string;
  timestamp: any; // Firestore Timestamp or serverTimestamp on write, string on read (ISO)
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file' | string; // Type of attachment
}

// Represents a chat room overview, could be stored in a `chatRooms` collection
export interface ChatRoom {
  id: string; // Firestore document ID (e.g., sortedUID1_sortedUID2)
  memberIds: string[];
  memberInfo: {
    [uid: string]: {
      name: string;
      avatarUrl?: string;
    };
  };
  lastMessageText?: string;
  lastMessageTimestamp?: any; // Firestore Timestamp
  lastMessageSenderId?: string;
  unreadCounts?: { [uid: string]: number };
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}


export interface Notification {
  id: string;
  userId: string; // The user who should receive this notification
  message: string;
  type: "issue_update" | "new_proposal" | "vote_deadline" | "chat_message" | "general" | "issue_assigned";
  link?: string; // Optional link to navigate to (e.g., /issues/issue123)
  isRead: boolean;
  createdAt: any; // Firestore Timestamp or serverTimestamp on write, string on read (ISO)
  createdBy?: string; // UID of user/system that generated it
  relatedEntityId?: string; // e.g., issueId or proposalId
}

export interface KPIData {
  label: string;
  value: string | number;
  previousValue?: string | number;
  unit?: string;
  change?: number; // Percentage change
}
