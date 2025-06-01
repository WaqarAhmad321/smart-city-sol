"use client";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User as AppUser } from "@/types"; // Your app's User type
import { useRouter } from "next/navigation"; // For redirecting after auth actions

interface AuthContextType {
  currentUser: FirebaseUser | null;
  currentUserProfile: AppUser | null; // Your app's user profile
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmailPassword: (
    name: string,
    email: string,
    password: string,
  ) => Promise<FirebaseUser | null>;
  signInWithEmailPassword: (
    email: string,
    password: string,
  ) => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<AppUser | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUserProfile(userSnap.data() as AppUser);
        } else {
          // This case handles users who signed up (e.g. Google) but profile creation might be pending
          // or if they signed up with email/password and updateProfile ran.
          const newUserProfile: AppUser = {
            id: user.uid,
            name: user.displayName || "New User", // Use displayName from Auth profile
            email: user.email || "",
            role: "citizen",
            avatarUrl:
              user.photoURL ||
              `https://placehold.co/100x100.png?text=${(user.displayName || "NU").substring(0, 2).toUpperCase()}`,
          };
          try {
            await setDoc(
              userRef,
              { ...newUserProfile, createdAt: serverTimestamp() },
              { merge: true },
            ); // Merge to be safe
            setCurrentUserProfile(newUserProfile);
          } catch (error) {
            console.error("Error creating/updating user profile:", error);
          }
        }
      } else {
        setCurrentUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting user and profile, then redirect
      router.push("/dashboard");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error; // Re-throw to be caught by UI
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmailPassword = async (
    name: string,
    email: string,
    password: string,
  ): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name });

      // Create Firestore profile (onAuthStateChanged will also attempt this, this is more immediate)
      const userRef = doc(db, "users", firebaseUser.uid);
      const newUserProfile: AppUser = {
        id: firebaseUser.uid,
        name: name,
        email: firebaseUser.email || "",
        role: "citizen",
        avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0, 2).toUpperCase()}`,
      };
      await setDoc(userRef, {
        ...newUserProfile,
        createdAt: serverTimestamp(),
      });
      setCurrentUserProfile(newUserProfile); // Eagerly set profile
      setCurrentUser(firebaseUser); // Eagerly set user

      router.push("/dashboard");
      return firebaseUser;
    } catch (error) {
      console.error("Error signing up with email/password:", error);
      throw error; // Re-throw
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmailPassword = async (
    email: string,
    password: string,
  ): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // onAuthStateChanged will handle setting user and profile
      router.push("/dashboard");
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in with email/password:", error);
      throw error; // Re-throw
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setCurrentUserProfile(null);
      router.push("/login"); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    currentUserProfile,
    loading,
    signInWithGoogle,
    signUpWithEmailPassword,
    signInWithEmailPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
