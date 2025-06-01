"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserNav } from "./user-nav";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  BarChart2,
  MapPin,
  MessageSquare,
  Vote,
  AlertTriangle,
  Wrench,
  ListChecks,
  Settings,
  LifeBuoy,
  Home,
  Users,
} from "lucide-react";

const allNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: <BarChart2 /> },
  { title: "Interactive Map", href: "/map", icon: <MapPin /> },
  { title: "Report Issue", href: "/report-issue", icon: <AlertTriangle /> }, // citizen
  { title: "Track Issues", href: "/issues", icon: <ListChecks /> }, // citizen, official, admin
  { title: "Public Polling", href: "/polling", icon: <Vote /> }, // citizen
  { title: "Communication", href: "/communication", icon: <MessageSquare /> }, // all
  {
    title: "Field Assistance",
    href: "/field-assistance",
    icon: <Wrench />,
    officialOnly: true,
  },
  // { title: "Automated Tasks", href: "/tasks", icon: <Settings /> /* Using Settings as proxy */, officialOnly: true },
  {
    title: "User Management",
    href: "/admin/users",
    icon: <Users />,
    adminOnly: true,
  },
];

const CitySyncLogo = () => (
  <Link
    href="/dashboard"
    className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center"
  >
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
    <span className="font-bold text-lg group-data-[collapsible=icon]:hidden font-headline">
      CitySync
    </span>
  </Link>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUserProfile } = useAuth();
  const userRole = currentUserProfile?.role;

  const navItems = allNavItems.filter((item) => {
    if (item.adminOnly) return userRole === "admin";
    if (item.officialOnly)
      return userRole === "admin" || userRole === "official";
    // Specific logic for citizen-only or shared items
    if (item.href === "/report-issue" || item.href === "/polling")
      return userRole === "citizen" || userRole === "admin"; // Admins can see citizen views
    return true; // Default to visible if no specific role restrictions
  });

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-2">
          <CitySyncLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href))
                    }
                    tooltip={item.title}
                    className="justify-start"
                    aria-label={item.title}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="justify-start"
                tooltip="Help & Support"
              >
                <LifeBuoy />
                <span>Help & Support</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="sm:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
