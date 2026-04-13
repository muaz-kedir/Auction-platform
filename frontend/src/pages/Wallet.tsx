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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, CreditCard, TrendingUp, Download } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useState } from "react";
import { toast } from "sonner@2.0.3";

const balanceHistory = [
  { date: "Apr 6", balance: 10500 },
  { date: "Apr 7", balance: 11200 },
  { date: "Apr 8", balance: 10800 },
  { date: "Apr 9", balance: 11500 },
  { date: "Apr 10", balance: 12100 },
  { date: "Apr 11", balance: 11900 },
  { date: "Apr 12", balance: 12450 },
];

const transactions = [
  {
    id: "1",
    type: "deposit",
    description: "Added funds via Credit Card",
    amount: 1000,
    date: "Apr 12, 2026",
    time: "10:30 AM",
    status: "completed",
  },
  {
    id: "2",
    type: "payment",
    description: "Won auction: Abstract Art Painting",
    amount: -2800,
    date: "Apr 10, 2026",
    time: "3:45 PM",
    status: "completed",
  },
  {
    id: "3",
    type: "deposit",
    description: "Added funds via Bank Transfer",
    amount: 500,
    date: "Apr 9, 2026",
    time: "9:15 AM",
    status: "completed",
  },
  {
    id: "4",
    type: "withdrawal",
    description: "Withdrawal to Bank Account",
    amount: -200,
    date: "Apr 8, 2026",
    time: "2:20 PM",
    status: "processing",
  },
  {
    id: "5",
    type: "payment",
    description: "Won auction: Professional Camera",
    amount: -1850,
    date: "Apr 8, 2026",
    time: "11:00 AM",
    status: "completed",
  },
  {
    id: "6",
    type: "deposit",
    description: "Added funds via Credit Card",
    amount: 2000,
    date: "Apr 7, 2026",
    time: "4:30 PM",
    status: "completed",
  },
  {
    id: "7",
    type: "refund",
    description: "Refund: Cancelled auction",
    amount: 350,
    date: "Apr 6, 2026",
    time: "1:15 PM",
    status: "completed",
  },
];

export function Wallet() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    toast.success("Deposit successful!", {
      description: `$${parseFloat(depositAmount).toLocaleString()} has been added to your wallet.`,
    });
    setDepositAmount("");
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (parseFloat(withdrawAmount) > 12450) {
      toast.error("Insufficient balance");
      return;
    }
    toast.success("Withdrawal initiated!", {
      description: `$${parseFloat(withdrawAmount).toLocaleString()} withdrawal is being processed.`,
    });
    setWithdrawAmount("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet</h1>
        <p className="text-muted-foreground">Manage your funds and transactions</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/20 to-card backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-primary">$12,450</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <WalletIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <span className="text-secondary">+8.5% this week</span>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
              <p className="text-3xl font-bold">$15,200</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <ArrowDownLeft className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Last deposit: $1,000</p>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-3xl font-bold">$8,350</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Last payment: $2,800</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4">Add Funds</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit">Amount (USD)</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => setDepositAmount("100")}>
                $100
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDepositAmount("500")}>
                $500
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDepositAmount("1000")}>
                $1,000
              </Button>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full gap-2" onClick={handleDeposit}>
                  <CreditCard className="h-4 w-4" />
                  Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Funds</DialogTitle>
                  <DialogDescription>
                    Choose your payment method to add funds to your wallet.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-4">
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <CreditCard className="h-5 w-5" />
                    Credit / Debit Card
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <WalletIcon className="h-5 w-5" />
                    Bank Transfer
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <div className="h-5 w-5">₿</div>
                    Cryptocurrency
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdraw">Amount (USD)</Label>
              <Input
                id="withdraw"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: $12,450
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => setWithdrawAmount("100")}>
                $100
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWithdrawAmount("500")}>
                $500
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWithdrawAmount("1000")}>
                $1,000
              </Button>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={handleWithdraw}>
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </Card>
      </div>

      {/* Balance Chart */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Balance History</h2>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={balanceHistory}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `$${value/1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a24',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#2563EB" 
              fillOpacity={1}
              fill="url(#colorBalance)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Transaction History */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-bold">Transaction History</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      transaction.type === "deposit" ? "bg-secondary/10 text-secondary" :
                      transaction.type === "withdrawal" ? "bg-purple-500/10 text-purple-500" :
                      transaction.type === "refund" ? "bg-blue-500/10 text-blue-500" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {transaction.type === "deposit" && <ArrowDownLeft className="h-5 w-5" />}
                      {transaction.type === "withdrawal" && <ArrowUpRight className="h-5 w-5" />}
                      {transaction.type === "payment" && <WalletIcon className="h-5 w-5" />}
                      {transaction.type === "refund" && <TrendingUp className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground capitalize">{transaction.type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{transaction.date}</p>
                    <p className="text-xs text-muted-foreground">{transaction.time}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={transaction.status === "completed" ? "default" : "outline"}
                    className={transaction.status === "completed" ? "bg-secondary" : ""}
                  >
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-semibold ${
                    transaction.amount > 0 ? "text-secondary" : "text-foreground"
                  }`}>
                    {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toLocaleString()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
