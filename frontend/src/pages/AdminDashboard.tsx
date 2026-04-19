import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import {
  Users,
  Gavel,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Search,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router";

interface Stats {
  totalUsers: number;
  totalAuctions: number;
  activeAuctions: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  openDisputes: number;
}

interface Auction {
  _id: string;
  title: string;
  seller: { name: string; email: string };
  currentBid: number;
  status: string;
  approvalStatus: string;
  createdAt: string;
  rejectionReason?: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  visibility: string;
  isActive: boolea