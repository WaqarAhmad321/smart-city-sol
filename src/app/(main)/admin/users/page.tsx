"use client";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import type { User, UserRole } from "@/types";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ShieldAlert,
  UserCog,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ [userId: string]: boolean }>(
    {},
  );
  const [updatingRole, setUpdatingRole] = useState<{
    [userId: string]: boolean;
  }>({});

  const { currentUserProfile } = useAuth(); // To ensure current user isn't accidentally modified or to restrict actions
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersQuery = query(collection(db, "users"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(usersQuery);
      const fetchedUsers: User[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "N/A",
          email: data.email || "N/A",
          role: data.role || "citizen",
          avatarUrl: data.avatarUrl,
          createdAt:
            data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          isActive: data.isActive !== undefined ? data.isActive : true,
        } as User;
      });
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUserProfile?.id && newRole !== "admin") {
      toast({
        title: "Action Denied",
        description: "Admins cannot change their own role to a non-admin role.",
        variant: "destructive",
      });
      return;
    }
    setUpdatingRole((prev) => ({ ...prev, [userId]: true }));
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}.`,
      });
    } catch (err) {
      console.error("Error updating role:", err);
      toast({
        title: "Update Failed",
        description: "Could not update user role.",
        variant: "destructive",
      });
    } finally {
      setEditingRole((prev) => ({ ...prev, [userId]: false }));
      setUpdatingRole((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleAccountStatusToggle = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    if (userId === currentUserProfile?.id) {
      toast({
        title: "Action Denied",
        description: "Admins cannot deactivate their own account.",
        variant: "destructive",
      });
      return;
    }
    setUpdatingRole((prev) => ({ ...prev, [userId]: true })); // Reuse updatingRole state for general loading
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { isActive: !currentStatus });
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, isActive: !currentStatus } : u,
        ),
      );
      toast({
        title: "Account Status Updated",
        description: `User account ${!currentStatus ? "activated" : "deactivated"}.`,
      });
    } catch (err) {
      console.error("Error updating account status:", err);
      toast({
        title: "Update Failed",
        description: "Could not update account status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRole((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="User Management"
          description="Manage user accounts and roles."
        />
        <div className="rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-5 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive bg-destructive/10 p-6 rounded-lg">
        <ShieldAlert className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error Loading Users</p>
        <p>{error}</p>
        <Button onClick={fetchUsers} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View, edit roles, and manage user accounts."
      >
        {/* <Button disabled><UserPlus className="mr-2 h-4 w-4" /> Create New User (Future)</Button> */}
      </PageHeader>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableCaption>A list of all registered users.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className={!user.isActive ? "opacity-60 bg-muted/30" : ""}
              >
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.name}
                      data-ai-hint="user avatar"
                    />
                    <AvatarFallback>
                      {user.name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {editingRole[user.id] ? (
                    <Select
                      defaultValue={user.role}
                      onValueChange={(newRole) =>
                        handleRoleChange(user.id, newRole as UserRole)
                      }
                      disabled={
                        updatingRole[user.id] ||
                        (user.id === currentUserProfile?.id &&
                          user.role === "admin")
                      }
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">Citizen</SelectItem>
                        <SelectItem value="official">Official</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "destructive"
                          : user.role === "official"
                            ? "default"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.isActive ? "secondary" : "outline"}
                    className={
                      user.isActive
                        ? "text-green-700 bg-green-100 border-green-300"
                        : "text-muted-foreground"
                    }
                  >
                    {user.isActive ? "Active" : "Deactivated"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {updatingRole[user.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin inline-block" />
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingRole((prev) => ({
                            ...prev,
                            [user.id]: !prev[user.id],
                          }))
                        }
                        disabled={
                          user.id === currentUserProfile?.id &&
                          user.role === "admin"
                        }
                        title={
                          user.id === currentUserProfile?.id &&
                          user.role === "admin"
                            ? "Admin role cannot be changed by self"
                            : "Edit Role"
                        }
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleAccountStatusToggle(
                            user.id,
                            user.isActive || true,
                          )
                        }
                        disabled={user.id === currentUserProfile?.id}
                        title={
                          user.id === currentUserProfile?.id
                            ? "Cannot deactivate self"
                            : user.isActive
                              ? "Deactivate Account"
                              : "Activate Account"
                        }
                      >
                        {user.isActive ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      {/* <Button variant="ghost" size="icon" disabled title="Delete User (Future)">
                        <Trash2 className="h-4 w-4 text-destructive/70" />
                      </Button> */}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && !isLoading && (
          <div className="text-center p-10 text-muted-foreground">
            <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
