import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Eye, 
  Plus, 
  MoreVertical,
  Clock,
  CheckCircle2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const salesData = [
  { month: "Jan", sales: 4200 },
  { month: "Feb", sales: 5100 },
  { month: "Mar", sales: 6300 },
  { month: "Apr", sales: 7800 },
  { month: "May", sales: 6900 },
  { month: "Jun", sales: 8500 },
];

const viewsData = [
  { date: "Apr 6", views: 120 },
  { date: "Apr 7", views: 145 },
  { date: "Apr 8", views: 132 },
  { date: "Apr 9", views: 168 },
  { date: "Apr 10", views: 189 },
  { date: "Apr 11", views: 210 },
  { date: "Apr 12", views: 195 },
];

const myAuctions = [
  {
    id: "1",
    title: "Luxury Swiss Watch",
    image: "https://images.unsplash.com/photo-1605101232508-283d0cd4909e?w=400&h=300&fit=crop",
    currentBid: 5420,
    views: 342,
    bids: 42,
    timeLeft: "2h 34m",
    status: "active",
  },
  {
    id: "2",
    title: "Vintage Camera Collection",
    image: "https://images.unsplash.com/photo-1678958169679-42e6ca5785e3?w=400&h=300&fit=crop",
    currentBid: 1250,
    views: 156,
    bids: 15,
    timeLeft: "1d 8h",
    status: "active",
  },
  {
    id: "3",
    title: "Abstract Art Painting",
    image: "https://images.unsplash.com/photo-1667980898743-fcfe470b7d2a?w=400&h=300&fit=crop",
    soldPrice: 2800,
    views: 234,
    bids: 23,
    endDate: "Apr 10, 2026",
    status: "sold",
  },
  {
    id: "4",
    title: "Professional DSLR Camera",
    image: "https://images.unsplash.com/photo-1678958169679-42e6ca5785e3?w=400&h=300&fit=crop",
    soldPrice: 1850,
    views: 189,
    bids: 19,
    endDate: "Apr 8, 2026",
    status: "sold",
  },
];

export function SellerPanel() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Seller Panel</h1>
          <p className="text-muted-foreground">Manage your listings and track sales</p>
        </div>
        <Link to="/dashboard/seller/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Auction
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
              <p className="text-3xl font-bold text-primary">$18,450</p>
              <p className="text-xs text-secondary mt-1">+12.5% this month</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Auctions</p>
              <p className="text-3xl font-bold">
                {myAuctions.filter(a => a.status === "active").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">2 ending soon</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Views</p>
              <p className="text-3xl font-bold">1,342</p>
              <p className="text-xs text-secondary mt-1">+18% this week</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Eye className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
              <p className="text-3xl font-bold">92%</p>
              <p className="text-xs text-muted-foreground mt-1">Above average</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6">Sales Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}>
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a24',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
              />
              <Bar dataKey="sales" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Views Chart */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6">Listing Views</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={viewsData}>
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a24',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [value, 'Views']}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* My Auctions */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-bold">My Auctions</h2>
        </div>
        <div className="p-6 space-y-4">
          {myAuctions.map((auction) => (
            <div
              key={auction.id}
              className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all"
            >
              <img 
                src={auction.image} 
                alt={auction.title}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{auction.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View Analytics</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">
                      {auction.status === "active" ? "Current Bid" : "Sold Price"}
                    </p>
                    <p className="font-medium text-primary">
                      ${(auction.currentBid || auction.soldPrice)?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-medium">{auction.views}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bids</p>
                    <p className="font-medium">{auction.bids}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {auction.status === "active" ? (
                    <>
                      <Badge className="bg-secondary">Active</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {auction.timeLeft} left
                      </span>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="border-secondary text-secondary">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Sold
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Ended {auction.endDate}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
