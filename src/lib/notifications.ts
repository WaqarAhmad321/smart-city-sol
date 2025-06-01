
'use server'; // To allow Firestore admin operations if this were backend, but client-side for now.

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Notification } from "@/types"; // Ensure Notification type has a 'type' field for notification category

interface CreateNotificationParams {
  userId: string; // User to receive the notification
  message: string;
  type: Notification['type']; // Use the type from Notification itself
  link?: string;
  relatedEntityId?: string;
  createdBy?: string; // UID of user/system that generated it
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  if (!params.userId || !params.message || !params.type) {
    console.error("Missing required parameters for creating notification:", params);
    return;
  }
  try {
    await addDoc(collection(db, "notifications"), {
      userId: params.userId,
      message: params.message,
      type: params.type,
      link: params.link || null,
      relatedEntityId: params.relatedEntityId || null,
      isRead: false,
      createdAt: serverTimestamp(),
      createdBy: params.createdBy || "system", // Default to system if not specified
    });
    // console.log("Notification created for user:", params.userId, "Message:", params.message);
  } catch (error) {
    console.error("Error creating notification:", error);
    // Optionally, you could re-throw or handle this more visibly in the calling function
  }
}
