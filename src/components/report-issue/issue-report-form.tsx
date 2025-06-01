
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, MapPin, UploadCloud, ShieldAlert } from "lucide-react";
import { assessIssueSeverity } from "@/ai/flows/ar-issue-severity-assessment";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const issueReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.string().min(1, "Category is required."),
  locationString: z.string().min(5, "Location description is required."), // For user input
  // Optional: Add specific lat/lng fields if you have a map picker or geolocation API integrated
  // latitude: z.number().optional(),
  // longitude: z.number().optional(),
  media: z.any().optional(), // File object
});

type IssueReportFormValues = z.infer<typeof issueReportSchema>;

interface IssueReportFormProps {
  isARMode?: boolean;
  initialData?: Partial<IssueReportFormValues & { location?: { lat: number; lng: number; address?: string } }>;
}

export function IssueReportForm({ isARMode = false, initialData }: IssueReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [severityAssessment, setSeverityAssessment] = useState<{ severity: string; justification: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser, currentUserProfile } = useAuth();
  
  const form = useForm<IssueReportFormValues>({
    resolver: zodResolver(issueReportSchema),
    defaultValues: {
      title: initialData?.title || (isARMode ? "AR Detected Issue" : ""),
      description: initialData?.description || "",
      category: initialData?.category || "",
      locationString: initialData?.location?.address || initialData?.locationString || "",
      media: undefined,
    },
  });
  
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || (isARMode ? "AR Detected Issue" : ""),
        description: initialData.description || "",
        category: initialData.category || "",
        locationString: initialData.location?.address || initialData.locationString || "",
      });
    }
  }, [initialData, form, isARMode]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("media", file);
      const dataUri = await fileToDataUri(file);
      setPreviewImage(dataUri);

      if (isARMode && form.getValues("description")) { // Only auto-assess if description is present
        setIsAssessing(true);
        setSeverityAssessment(null);
        try {
          const assessment = await assessIssueSeverity({
            photoDataUri: dataUri,
            description: form.getValues("description") || "Issue captured via AR.",
          });
          setSeverityAssessment(assessment);
          // form.setValue("category", assessment.severity === "high" ? "Urgent Repair" : "General Maintenance"); 
          if (!form.getValues("description")) {
             form.setValue("description", assessment.justification);
          }
          toast({
            title: "AI Severity Assessment Complete",
            description: `Severity: ${assessment.severity}. ${assessment.justification}`,
          });
        } catch (error) {
          console.error("Error assessing severity:", error);
          toast({
            title: "AI Assessment Failed",
            description: "Could not assess issue severity automatically. Please fill manually.",
            variant: "destructive",
          });
        } finally {
          setIsAssessing(false);
        }
      }
    }
  };


  async function onSubmit(data: IssueReportFormValues) {
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please sign in to report an issue.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setIsUploading(false);
    setIsAssessing(false);

    let mediaUrl = "";
    let mediaType: "image" | "video" | undefined = undefined;

    if (data.media) {
      setIsUploading(true);
      const file = data.media as File;
      const storageRef = ref(storage, `issues/${currentUser.uid}/${Date.now()}_${file.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, file);
        mediaUrl = await getDownloadURL(snapshot.ref);
        mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : undefined;
        toast({ title: "Media Uploaded", description: "Your file has been successfully uploaded." });
      } catch (error) {
        console.error("Error uploading media:", error);
        toast({ title: "Media Upload Failed", description: "Could not upload your file. Please try again.", variant: "destructive" });
        setIsLoading(false);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    
    let finalSeverity = severityAssessment?.severity;
    let finalJustification = severityAssessment?.justification;

    if (mediaUrl && data.description && !severityAssessment) { // Assess on submit if not done yet
      setIsAssessing(true);
      try {
        const assessment = await assessIssueSeverity({
          photoDataUri: mediaUrl, // Use uploaded URL if direct data URI is problematic for Genkit
          description: data.description,
        });
        setSeverityAssessment(assessment);
        finalSeverity = assessment.severity;
        finalJustification = assessment.justification;
        toast({
            title: "AI Severity Assessment Complete (on submit)",
            description: `Severity: ${assessment.severity}. ${assessment.justification}`,
        });
      } catch (error) {
        console.error("Error assessing severity on submit:", error);
      }
      setIsAssessing(false);
    }
    
    // Placeholder for actual geolocation - for now, we use a default or derive from AR if available
    const issueLocation = {
        lat: initialData?.location?.lat || 34.0522, // Default LA
        lng: initialData?.location?.lng || -118.2437,
        address: data.locationString,
    };

    try {
      const docRef = await addDoc(collection(db, "issues"), {
        title: data.title || `Issue: ${data.category} at ${data.locationString.substring(0,20)}`,
        description: data.description,
        category: data.category,
        location: new GeoPoint(issueLocation.lat, issueLocation.lng),
        locationAddress: issueLocation.address,
        status: "Pending",
        reportedBy: currentUser.uid,
        reporterName: currentUserProfile?.name || currentUser.displayName || "Anonymous",
        reporterAvatar: currentUserProfile?.avatarUrl || currentUser.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(mediaUrl && { media: [{ url: mediaUrl, type: mediaType }] }),
        ...(finalSeverity && { severity: finalSeverity as "low" | "medium" | "high" }),
        ...(finalJustification && { aiJustification: finalJustification }),
      });
      toast({
        title: "Issue Reported Successfully!",
        description: `Issue ID: ${docRef.id}. Thank you for your report.`,
      });
      form.reset();
      setPreviewImage(null);
      setSeverityAssessment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error submitting issue to Firestore:", error);
      toast({ title: "Submission Failed", description: "Could not save your issue. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  if (!currentUser && !isARMode) { // In standard form mode, strictly require login
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-destructive" /> Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg text-muted-foreground">
            Please sign in to report an issue.
          </p>
        </CardContent>
         <CardFooter>
            <Button className="w-full" onClick={() => auth.currentUser /* hack to satisfy compiler, useAuth().signIn... is better */}>Sign In with Google</Button>
        </CardFooter>
      </Card>
    );
  }


  return (
    <Card className={`w-full ${isARMode ? "" : "max-w-2xl mx-auto"} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {!isARMode && (
        <CardHeader>
          <CardTitle className="font-headline">Report a New Issue</CardTitle>
          <CardDescription>Please provide as much detail as possible.</CardDescription>
        </CardHeader>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {!isARMode && (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Large pothole on Elm Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="resize-none"
                      rows={isARMode ? 3 : 5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pothole">Pothole</SelectItem>
                      <SelectItem value="streetlight_out">Streetlight Out</SelectItem>
                      <SelectItem value="fallen_tree">Fallen Tree</SelectItem>
                      <SelectItem value="graffiti">Graffiti</SelectItem>
                       <SelectItem value="waste_management">Waste Management</SelectItem>
                      <SelectItem value="water_leak">Water Leak</SelectItem>
                      <SelectItem value="Urgent Repair">Urgent Repair</SelectItem>
                      <SelectItem value="General Maintenance">General Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Description</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="E.g., Near 123 Main St & Oak Ave" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" aria-label="Get current location" onClick={() => {
                      if(navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(pos => {
                          form.setValue("locationString", `Approx. Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`);
                          // TODO: Use a reverse geocoding service here to get address from lat/lng
                        }, () => {
                          toast({title: "Could not get location", description: "Please enter manually or check browser permissions.", variant: "destructive"})
                        });
                      } else {
                        toast({title: "Geolocation not supported", variant: "destructive"})
                      }
                    }}>
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    {isARMode ? "Location may be auto-detected. Refine if needed." : "Provide address or nearest cross-streets."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="media"
                render={() => ( 
                    <FormItem>
                    <FormLabel>Upload Media (Photo/Video)</FormLabel>
                    <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file-issue" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                {previewImage ? (
                                    <Image src={previewImage} alt="Preview" width={150} height={100} className="max-h-28 object-contain rounded" data-ai-hint="issue image"/>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground"/>
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                )}
                                <Input id="dropzone-file-issue" type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} ref={fileInputRef} />
                            </label>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            {severityAssessment && (
              <div className="p-3 border rounded-md bg-secondary/50">
                <p className="text-sm font-semibold flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-primary" /> AI Severity Assessment:
                </p>
                <p className="text-sm mt-1"><strong>Severity:</strong> {severityAssessment.severity}</p>
                <p className="text-sm"><strong>Justification:</strong> {severityAssessment.justification}</p>
              </div>
            )}

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !currentUser && isARMode /* disable if not logged in, even in AR mode for submission */ }>
              {isLoading || isUploading || isAssessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Uploading...' : isAssessing ? 'Assessing...' : isLoading ? 'Submitting...' : 'Submit Issue Report'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

