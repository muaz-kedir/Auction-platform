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
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "active", joined: "Jan 15, 2026", auctions: 12, spent: "$5,420" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "active", joined: "Feb 3, 2026", auctions: 8, spent: "$3,200" },
  { id: 3, name: "Bob Wilson", email: "bob@example.com", status: "suspended", joined: "Mar 10, 2026", auctions: 3, spent: "$850" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "active", joined: "Apr 1, 2026", auctions: 15, spent: "$8,900" },
];

const auctions = [
  { id: 1, title: "Luxury Swiss Watch", seller: "Premium Watches Inc.", status: "active", bids: 42, currentBid: "$5,420" },
  { id: 2, title: "Vintage Camera", seller: "Collectibles Hub", status: "pending", bids: 15, currentBid: "$1,250" },
  { id: 3, title: "Abstract Art Painting", seller: "Art Gallery Pro", status: "sold", bids: 23, finalPrice: "$2,800" },
  { id: 4, title: "Diamond Ring", seller: "Jewelry Experts", status: "flagged", bids: 34, currentBid: "$8,900" },
];

const disputes = [
  { id: 1, auction: "Abstract Art Painting", buyer: "User #8234", seller: "Art Gallery Pro", reason: "Item not as described", status: "open" },
  { id: 2, auction: "Professional Camera", buyer: "User #5421", seller: "Camera Store", reason: "Shipping damage", status: "resolved" },
  { id: 3, auction: "Vintage Watch", buyer: "User #7192", seller: "Watch Dealer", reason: "Payment issue", status: "open" },
];

const withdrawals = [
  { id: 1, seller: "Premium Watches Inc.", amount: "$5,420", method: "Bank Transfer", status: "pending", date: "Apr 12, 2026" },
  { id: 2, seller: "Art Gallery Pro", amount: "$2,800", method: "PayPal", status: "approved", date: "Apr 10, 2026" },
  { id: 3, seller: "Collectibles Hub", amount: "$1,250", method: "Bank Transfer", status: "pending", date: "Apr 11, 2026" },
];

export function AdminPanel() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, auctions, and platform operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-bold">50,234</p>
              <p className="text-xs text-secondary mt-1">+245 this week</p>
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
              <p className="text-3xl font-bold">1,432</p>
              <p className="text-xs text-muted-foreground mt-1">234 ending today</p>
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
              <p className="text-3xl font-bold">$2.4M</p>
              <p className="text-xs text-secondary mt-1">+8.5% this month</p>
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
              <p className="text-3xl font-bold">12</p>
              <p className="text-xs text-destructive mt-1">Requires attention</p>
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
                <Input placeholder="Search users..." className="pl-10" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Auctions</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "destructive"} className={user.status === "active" ? "bg-secondary" : ""}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.joined}</TableCell>
                    <TableCell>{user.auctions}</TableCell>
                    <TableCell>{user.spent}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Suspend Account</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Auctions Tab */}
        <TabsContent value="auctions" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xl font-bold">Auction Moderation</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search auctions..." className="pl-10" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bids</TableHead>
                  <TableHead>Current/Final</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auctions.map((auction) => (
                  <TableRow key={auction.id}>
                    <TableCell className="font-medium">{auction.title}</TableCell>
                    <TableCell>{auction.seller}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          auction.status === "active" ? "default" :
                          auction.status === "sold" ? "outline" :
                          auction.status === "flagged" ? "destructive" :
                          "outline"
                        }
                        className={
                          auction.status === "active" ? "bg-secondary" :
                          auction.status === "sold" ? "border-secondary text-secondary" :
                          ""
                        }
                      >
                        {auction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{auction.bids}</TableCell>
                    <TableCell>{auction.currentBid || auction.finalPrice}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Approve</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove Listing</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-bold">Dispute Management</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auction</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">{dispute.auction}</TableCell>
                    <TableCell>{dispute.buyer}</TableCell>
                    <TableCell>{dispute.seller}</TableCell>
                    <TableCell>{dispute.reason}</TableCell>
                    <TableCell>
                      <Badge variant={dispute.status === "open" ? "destructive" : "default"} className={dispute.status === "resolved" ? "bg-secondary" : ""}>
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {dispute.status === "open" && (
                          <>
                            <Button size="sm" variant="outline">Review</Button>
                            <Button size="sm">Resolve</Button>
                          </>
                        )}
                        {dispute.status === "resolved" && (
                          <Button size="sm" variant="outline">View Details</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-bold">Withdrawal Approvals</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">{withdrawal.seller}</TableCell>
                    <TableCell className="font-semibold text-primary">{withdrawal.amount}</TableCell>
                    <TableCell>{withdrawal.method}</TableCell>
                    <TableCell>{withdrawal.date}</TableCell>
                    <TableCell>
                      <Badge variant={withdrawal.status === "pending" ? "outline" : "default"} className={withdrawal.status === "approved" ? "bg-secondary" : ""}>
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {withdrawal.status === "pending" && (
                          <>
                            <Button size="sm" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          </>
                        )}
                        {withdrawal.status === "approved" && (
                          <Button size="sm" variant="outline">View Details</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
