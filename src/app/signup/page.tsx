"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signUpWithEmailPassword, signInWithGoogle, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setAuthError(null);
    try {
      await signUpWithEmailPassword(data.name, data.email, data.password);
      // Redirect is handled by AuthContext or (auth)/layout.tsx
      toast({ title: "Account Created!", description: "Welcome to CitySync!" });
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleFirebaseAuthError(error);
      } else {
        setAuthError("An unexpected error occurred. Please try again.");
      }
      console.error("Signup error:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      // Redirect is handled by AuthContext or (auth)/layout.tsx
      toast({
        title: "Account Created/Signed In!",
        description: "Welcome to CitySync!",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleFirebaseAuthError(error);
      } else {
        setAuthError(
          "An unexpected error occurred with Google Sign-In. Please try again.",
        );
      }
      console.error("Google Sign-In error:", error);
    }
  };

  const handleFirebaseAuthError = (error: FirebaseError) => {
    switch (error.code) {
      case "auth/email-already-in-use":
        setAuthError("This email address is already in use. Try logging in.");
        break;
      case "auth/weak-password":
        setAuthError(
          "The password is too weak. Please choose a stronger password.",
        );
        break;
      case "auth/invalid-email":
        setAuthError("The email address is not valid.");
        break;
      case "auth/popup-closed-by-user":
        setAuthError("Google Sign-In was cancelled.");
        break;
      case "auth/popup-blocked":
        setAuthError(
          "Google Sign-In popup was blocked by the browser. Please disable your popup blocker and try again.",
        );
        break;
      default:
        setAuthError("Signup failed. Please try again.");
        break;
    }
  };

  const CitySyncLogoSmall = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className="flex items-center justify-center bg-primary text-primary-foreground p-2 rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M15.59 13.51a6 6 0 00-7.18 0" />
        </svg>
      </div>
      <span className="font-bold text-xl font-headline text-foreground">
        CitySync
      </span>
    </div>
  );

  return (
    <div className="w-full flex h-screen items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CitySyncLogoSmall />
          <CardTitle className="text-2xl font-headline">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join CitySync to help improve your city.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {authError && (
                <p className="text-sm text-destructive text-center">
                  {authError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </Form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
            )}
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/login">Sign in</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
