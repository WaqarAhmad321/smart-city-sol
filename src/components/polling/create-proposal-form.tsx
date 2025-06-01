
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2, Upload, Loader2, MapPin } from "lucide-react";
import { cn, fileToDataUri } from "@/lib/utils";
import { format } from "date-fns";
import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, Timestamp, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image"; 

const proposalFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  votingDeadline: z.date({ required_error: "Voting deadline is required." }),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
  mediaFile: z.any().optional(), 
  locationAddress: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
}).refine(data => (data.latitude === undefined && data.longitude === undefined) || (data.latitude !== undefined && data.longitude !== undefined), {
  message: "Both latitude and longitude must be provided if one is entered, or both left empty.",
  path: ["latitude"], 
});


type ProposalFormValues = z.infer<typeof proposalFormSchema>;

interface CreateProposalFormProps {
  triggerButton?: React.ReactNode;
  onProposalCreated?: () => void; 
}

export function CreateProposalForm({ triggerButton, onProposalCreated }: CreateProposalFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      options: [{ text: "Yes" }, { text: "No" }],
      mediaFile: undefined,
      locationAddress: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("mediaFile", file);
      const dataUri = await fileToDataUri(file);
      setPreviewImage(dataUri);
    } else {
      form.setValue("mediaFile", undefined);
      setPreviewImage(null);
    }
  };

  async function onSubmit(data: ProposalFormValues) {
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please sign in to create a proposal.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    let mediaUrl: string | undefined = undefined;
    let mediaType: "image" | "video" | undefined = undefined;

    if (data.mediaFile) {
      const file = data.mediaFile as File;
      const storageRef = ref(storage, `proposals/${currentUser.uid}/${Date.now()}_${file.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, file);
        mediaUrl = await getDownloadURL(snapshot.ref);
        mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : undefined;
        toast({ title: "Media Uploaded", description: "Proposal media successfully uploaded." });
      } catch (error) {
        console.error("Error uploading proposal media:", error);
        toast({ title: "Media Upload Failed", description: "Could not upload media. Please try again.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }
    
    const proposalData: any = {
        title: data.title,
        description: data.description,
        votingDeadline: Timestamp.fromDate(data.votingDeadline),
        options: data.options.map(opt => ({ id: crypto.randomUUID(), text: opt.text, votes: 0 })),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalVotes: 0,
        voters: {},
        ...(mediaUrl && { mediaUrl }),
        ...(mediaType && { mediaType }),
    };

    if (data.latitude !== undefined && data.longitude !== undefined) {
        proposalData.location = new GeoPoint(data.latitude, data.longitude);
        if (data.locationAddress) {
            proposalData.locationAddress = data.locationAddress;
        }
    } else if (data.locationAddress && data.locationAddress.trim() !== "") {
        proposalData.locationAddress = data.locationAddress;
    }


    try {
      await addDoc(collection(db, "proposals"), proposalData);
      toast({
        title: "Proposal Created",
        description: `"${data.title}" has been successfully created.`,
      });
      setOpen(false);
      form.reset();
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onProposalCreated?.();
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast({ title: "Creation Failed", description: "Could not create the proposal. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        form.reset();
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }}>
      <DialogTrigger asChild>
        {triggerButton ? (
          React.isValidElement(triggerButton) ? triggerButton : <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Proposal</Button>
        ) : (
          <Button variant="default">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Proposal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Proposal</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new city improvement proposal for public voting.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposal Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., New Downtown Park" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the proposal..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="votingDeadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Voting Deadline</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } 
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Voting Options</FormLabel>
              {fields.map((item, index) => (
                <FormField
                  control={form.control}
                  key={item.id}
                  name={`options.${index}.text`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 mt-1">
                      <FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...field} />
                      </FormControl>
                      {fields.length > 2 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Remove option">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ text: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
              </Button>
            </div>

            <FormField
              control={form.control}
              name="locationAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., 123 Main St, Anytown" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 34.0522" value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., -118.2437" value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             {form.formState.errors.latitude && ( 
                <p className="text-sm font-medium text-destructive">{form.formState.errors.latitude.message}</p>
            )}


            <FormField
              control={form.control}
              name="mediaFile"
              render={() => ( 
                <FormItem>
                  <FormLabel>Optional Media (Image)</FormLabel>
                  <FormControl>
                     <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file-proposal" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            {previewImage ? (
                                <Image src={previewImage} alt="Media preview" width={120} height={100} className="max-h-28 object-contain rounded" data-ai-hint="proposal media"/>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground"/>
                                    <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. 5MB)</p>
                                </div>
                            )}
                            <Input id="dropzone-file-proposal" type="file" className="hidden" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                        </label>
                    </div> 
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating..." : "Create Proposal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

