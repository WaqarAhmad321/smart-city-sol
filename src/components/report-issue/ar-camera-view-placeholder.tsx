"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, ScanLine } from "lucide-react";
import Image from "next/image";

export function ARCameraViewPlaceholder() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="font-headline">AR Camera View</CardTitle>
        <CardDescription>Point your camera at the issue. We'll try to detect details automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border border-dashed p-4">
          <Image 
            src="https://placehold.co/400x225.png?text=AR+Camera+Feed" 
            alt="AR Camera Placeholder" 
            width={400} 
            height={225} 
            className="max-w-full h-auto opacity-60 rounded-md"
            data-ai-hint="street view"
          />
          <p className="mt-2 text-sm text-muted-foreground">Live camera feed will appear here.</p>
        </div>
        <Button className="w-full">
          <Camera className="mr-2 h-4 w-4" /> Capture Issue with AR
        </Button>
        <div className="text-xs text-muted-foreground text-center p-2 border rounded-md bg-secondary/50">
            <ScanLine className="h-5 w-5 mx-auto mb-1 text-primary" />
            <strong>AR Feature:</strong>
            <p>This section will utilize your device's camera. The system will attempt to identify the issue type (e.g., pothole, broken streetlight) and estimate its severity or size using image recognition. Location data will be captured via GPS and AR positioning.</p>
        </div>
      </CardContent>
    </Card>
  );
}
