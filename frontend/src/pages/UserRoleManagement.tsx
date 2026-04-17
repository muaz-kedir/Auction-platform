import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Search, UserPlus, Edit, Trash2, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  verified: boolean;
  createdAt: string;
  walletBalance?: number;
}

export function UserRoleManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    isBanned: false,
    verified: false,
  });

  // Delete Confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === "super_admin";

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter && roleFilter !== "all") params.role = roleFilter;

      const response = await api.admin.getAllUsers(params);
      setUsers(response.users);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error("All fields are required");
      return;
    }

    if (createForm.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setCreateLoading(true);
    try {
      if (createForm.role === "admin" || createForm.role === "super_admin") {
        await api.admin.createAdmin(createForm);
      } else {
        await api.auth.register(createForm);
      }
      
      toast.success("User created successfully");
      setCreateModalOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "buyer" });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isBanned: user.isBanned,
      verified: user.verified,
    });
    setEditModalOpen(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    if (!editForm.name || !editForm.email) {
      toast.error("Name and email are required");
      return;
    }

    setEditLoading(true);
    try {
      await api.admin.updateUser(editingUser._id, editForm);
      toast.success("User updated successfully");
      setEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      await api.admin.deleteUser(deletingUser._id);
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      super_admin: <Badge className="bg-red-500 hover:bg-red-600">SUPER ADMIN</Badge>,
      admin: <Badge className="bg-blue-500 hover:bg-blue-600">ADMIN</Badge>,
      seller: <Badge className="bg-green-500 hover:bg-green-600">SELLER</Badge>,
      buyer: <Badge variant="secondary">BUYER</Badge>,
    };
    return badges[role as keyof typeof badges] || <Badge>{role}</Badge>;
  };

  const getStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (!user.verified) {
      return <Badge variant="outline">Unverified</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
  };

  const canEditUser = (user: User) => {
    if (!isSuperAdmin) {
      // Admins cannot edit super_admin or other admins
      if (user.role === "super_admin" || user.role === "admin") {
        return false;
      }
    }
    return true;
  };

  const canDeleteUser = (user: User) => {
    // Only super admin can delete users
    if (!isSuperAdmin) return false;
    // Cannot delete yourself
    if (user._id === currentUser?._id) return false;
    return true;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User & Role Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      ${(user.walletBalance || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEditUser(user) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteUser(user) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with a specific role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                placeholder="Enter password (min 8 characters)"
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value: string) =>
                  setCreateForm({ ...createForm, role: value })
                }
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                  {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createLoading}>
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            {isSuperAdmin && (
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: string) =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.verified}
                  onChange={(e) =>
                    setEditForm({ ...editForm, verified: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">Verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isBanned}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isBanned: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">Suspended</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={editLoading}>
              {editLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{" "}
              <strong>{deletingUser?.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
