import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { 
  Users, 
  Gavel, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Search,
  MoreVertical,
  Loader2,
  Shield,
  Megaphone
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { toast } from "sonner";
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

interface Stats {
  totalUsers: number;
  totalAuctions: number;
  activeAuctions: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  openDisputes: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  verified: boolean;
  walletBalance: number;
  createdAt: string;
}

interface Auction {
  _id: string;
  title: string;
  seller: { _id: string; name: string; email: string };
  status: string;
  currentBid: number;
  bidCount: number;
  endTime: string;
}

interface Dispute {
  _id: string;
  auction: { _id: string; title: string };
  buyer: { _id: string; name: string; email: string };
  seller: { _id: string; name: string; email: string };
  reason: string;
  status: string;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  user: { _id: string; name: string; email: string };
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

export function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchUsers, setSearchUsers] = useState("");
  const [searchAuctions, setSearchAuctions] = useState("");
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string; name: string }>({
    open: false,
    type: "",
    id: "",
    name: ""
  });

  // Fetch dashboard stats
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    fetchUsers();
    fetchAuctions();
    fetchDisputes();
    fetchWithdrawals();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.admin.getStats();
      setStats(data);
    } catch (error: any) {
      toast.error("Failed to load stats");
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllUsers({ search: searchUsers, limit: 50 });
      setUsers(data.users);
    } catch (error: any) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllAuctions({ search: searchAuctions, limit: 50 });
      setAuctions(data.auctions);
    } catch (error: any) {
      toast.error("Failed to load auctions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllDisputes({ limit: 50 });
      setDisputes(data.disputes);
    } catch (error: any) {
      toast.error("Failed to load disputes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllWithdrawals({ limit: 50 });
      setWithdrawals(data.withdrawals);
    } catch (error: any) {
      toast.error("Failed to load withdrawals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      await api.admin.updateUserStatus(userId, { isBanned });
      toast.success(isBanned ? "User banned successfully" : "User unbanned successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to update user status");
      console.error(error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.admin.deleteUser(deleteDialog.id);
      toast.success("User deleted successfully");
      setDeleteDialog({ open: false, type: "", id: "", name: "" });
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to delete user");
      console.error(error);
    }
  };

  const handleDeleteAuction = async () => {
    try {
      await api.admin.deleteAuction(deleteDialog.id);
      toast.success("Auction deleted successfully");
      setDeleteDialog({ open: false, type: "", id: "", name: "" });
      fetchAuctions();
    } catch (error: any) {
      toast.error("Failed to delete auction");
      console.error(error);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      await api.withdraw.approve(id);
      toast.success("Withdrawal approved successfully");
      fetchWithdrawals();
      fetchStats();
    } catch (error: any) {
      toast.error("Failed to approve withdrawal");
      console.error(error);
    }
  };

  const handleResolveDispute = async (id: string) => {
    try {
      await api.disputes.resolve(id, "Resolved by admin");
      toast.success("Dispute resolved successfully");
      fetchDisputes();
      fetchStats();
    } catch (error: any) {
      toast.error("Failed to resolve dispute");
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, auctions, and platform operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = "/dashboard/admin/users"} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button onClick={() => window.location.href = "/dashboard/admin/wallet-funding"} variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Wallet Funding
          </Button>
          <Button onClick={() => window.location.href = "/dashboard/admin/announcements"}>
            <Megaphone className="h-4 w-4 mr-2" />
            Announcements
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Auctions</p>
              <p className="text-3xl font-bold">{stats?.activeAuctions || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">of {stats?.totalAuctions || 0} total</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Gavel className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Open Disputes</p>
              <p className="text-3xl font-bold">{stats?.openDisputes || 0}</p>
              <p className="text-xs text-destructive mt-1">{stats?.pendingWithdrawals || 0} pending withdrawals</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="auctions">Auctions</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xl font-bold">User Management</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-10"
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isBanned ? "destructive" : "default"} className={!user.isBanned ? "bg-secondary" : ""}>
                            {user.isBanned ? "Banned" : user.verified ? "Active" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(user.walletBalance)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleBanUser(user._id, !user.isBanned)}>
                                {user.isBanned ? "Unban User" : "Ban User"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, type: "user", id: user._id, name: user.name })}
                              >
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Auctions Tab */}
        <TabsContent value="auctions" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xl font-bold">Auction Moderation</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search auctions..." 
                  className="pl-10"
                  value={searchAuctions}
                  onChange={(e) => setSearchAuctions(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAuctions()}
                />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bids</TableHead>
                    <TableHead>Current Bid</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auctions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No auctions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    auctions.map((auction) => (
                      <TableRow key={auction._id}>
                        <TableCell className="font-medium">{auction.title}</TableCell>
                        <TableCell>{auction.seller?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={auction.status === "ACTIVE" ? "default" : "outline"}
                            className={auction.status === "ACTIVE" ? "bg-secondary" : ""}
                          >
                            {auction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{auction.bidCount}</TableCell>
                        <TableCell>{formatCurrency(auction.currentBid)}</TableCell>
                        <TableCell>{formatDate(auction.endTime)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, type: "auction", id: auction._id, name: auction.title })}
                              >
                                Delete Auction
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-bold">Dispute Management</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No disputes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    disputes.map((dispute) => (
                      <TableRow key={dispute._id}>
                        <TableCell className="font-medium">{dispute.auction?.title || "N/A"}</TableCell>
                        <TableCell>{dispute.buyer?.name || "Unknown"}</TableCell>
                        <TableCell>{dispute.seller?.name || "Unknown"}</TableCell>
                        <TableCell>{dispute.reason}</TableCell>
                        <TableCell>
                          <Badge variant={dispute.status === "OPEN" ? "destructive" : "default"} className={dispute.status === "RESOLVED" ? "bg-secondary" : ""}>
                            {dispute.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(dispute.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {dispute.status === "OPEN" && (
                              <Button size="sm" onClick={() => handleResolveDispute(dispute._id)}>
                                Resolve
                              </Button>
                            )}
                            {dispute.status === "RESOLVED" && (
                              <Button size="sm" variant="outline">View Details</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-bold">Withdrawal Approvals</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No withdrawals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal._id}>
                        <TableCell className="font-medium">{withdrawal.user?.name || "Unknown"}</TableCell>
                        <TableCell className="font-semibold text-primary">{formatCurrency(withdrawal.amount)}</TableCell>
                        <TableCell>{withdrawal.method}</TableCell>
                        <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={withdrawal.status === "PENDING" ? "outline" : "default"} className={withdrawal.status === "APPROVED" ? "bg-secondary" : ""}>
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {withdrawal.status === "PENDING" && (
                              <>
                                <Button size="sm" className="gap-1" onClick={() => handleApproveWithdrawal(withdrawal._id)}>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {withdrawal.status === "APPROVED" && (
                              <Button size="sm" variant="outline">View Details</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteDialog.type} "{deleteDialog.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteDialog.type === "user" ? handleDeleteUser : handleDeleteAuction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
