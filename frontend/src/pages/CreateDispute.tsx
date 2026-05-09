import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { AlertCircle, ArrowLeft, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

export function CreateDispute() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [auction, setAuction] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
    evidence: [] as any[]
  });

  useEffect(() => {
    if (auctionId) {
      fetchAuctionDetails();
    }
  }, [auctionId]);

  const fetchAuctionDetails = async () => {
    try {
      setFetching(true);
      const data = await api.auctions.getById(auctionId!);
      setAuction(data);
    } catch (error) {
      console.error("Error fetching auction:", error);
      toast.error("Failed to load auction details");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await api.disputes.create({
        auctionId: auctionId!,
        reason: formData.reason,
        description: formData.description,
        evidence: formData.evidence
      });
      
      toast.success("Dispute submitted successfully");
      navigate(`/auction/${auctionId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit dispute");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            Open a Dispute
          </CardTitle>
          <CardDescription>
            Report an issue with auction: <strong>{auction?.title}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="dispute-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Dispute</Label>
              <Select 
                onValueChange={(val) => setFormData({ ...formData, reason: val })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Item not received">Item not received</SelectItem>
                  <SelectItem value="Item not as described">Item not as described</SelectItem>
                  <SelectItem value="Payment issue">Payment issue</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea 
                id="description"
                placeholder="Explain the issue in detail..."
                className="min-h-[150px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Evidence (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">Upload images or documents to support your claim</p>
                <Button type="button" variant="outline" size="sm" disabled>
                  Upload Files (Coming Soon)
                </Button>
                <p className="text-xs text-muted-foreground mt-2 italic">For now, please describe the evidence in the text area above.</p>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t p-6">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="dispute-form" 
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Dispute
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-semibold mb-1">Important Notice</p>
            <p>Once a dispute is opened, the funds for this auction will be held in escrow and cannot be released until an admin resolves the case. Please provide as much detail as possible to speed up the process.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
