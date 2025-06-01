import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { MapPin, BarChart2, MessageSquare, Vote, AlertTriangle, UserCheck, ListChecks, CheckSquare, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/50 p-6">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center bg-primary text-primary-foreground p-4 rounded-full mb-6 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M12 11a3 3 0 100-6 3 3 0 000 6z"/>
            <path d="M15.59 13.51a6 6 0 00-7.18 0"/>
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-3 font-headline">Welcome to CitySync</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your integrated platform for smarter city management and citizen engagement. Report issues, participate in polls, and stay connected.
        </p>
      </header>

      <main className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { title: "Report Issues", description: "Easily report civic issues using our intuitive AR-powered system.", icon: <AlertTriangle className="w-8 h-8 text-primary" /> },
            { title: "Track Progress", description: "Stay updated on the status of reported issues in real-time.", icon: <ListChecks className="w-8 h-8 text-primary" /> },
            { title: "Voice Your Opinion", description: "Participate in public polls and shape your city's future.", icon: <Vote className="w-8 h-8 text-primary" /> },
            { title: "Interactive Map", description: "Explore city data, issues, and proposals on an interactive map.", icon: <MapPin className="w-8 h-8 text-primary" /> },
            { title: "Stay Informed", description: "Receive notifications and communicate with city officials.", icon: <MessageSquare className="w-8 h-8 text-primary" /> },
            { title: "Data-Driven Insights", description: "Access dashboards visualizing key city metrics (Admin).", icon: <BarChart2 className="w-8 h-8 text-primary" /> },
          ].map(feature => (
            <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  {feature.icon}
                </div>
                <CardTitle className="font-headline">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <Link href="/dashboard">
              Go to Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </Link>
          </Button>
        </div>
      </main>

      <footer className="mt-16 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CitySync. All rights reserved.</p>
      </footer>
    </div>
  );
}
