import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Upload, X, ImageIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner@2.0.3";

export function CreateAuction() {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Auction created successfully!", {
      description: "Your auction is now live and visible to buyers.",
    });
    navigate("/dashboard/seller");
  };

  const handleImageUpload = () => {
    // Simulate image upload
    const placeholders = [
      "https://images.unsplash.com/photo-1605101232508-283d0cd4909e?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    ];
    setImages([...images, placeholders[images.length % 2]]);
    toast.success("Image uploaded successfully!");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Create New Auction</h1>
        <p className="text-muted-foreground">List your item and start receiving bids</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6">Basic Information</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="e.g., Luxury Swiss Automatic Watch" 
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="watches">Watches</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="vehicles">Vehicles</SelectItem>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="collectibles">Collectibles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                placeholder="Provide detailed information about your item..."
                rows={6}
                required
              />
            </div>
          </div>
        </Card>

        {/* Images */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6">Images</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border/50">
                  <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <button
                  type="button"
                  onClick={handleImageUpload}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Upload</span>
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload up to 8 images. First image will be the cover photo.
            </p>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6">Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startingBid">Starting Bid (USD) *</Label>
              <Input 
                id="startingBid" 
                type="number" 
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservePrice">Reserve Price (USD)</Label>
              <Input 
                id="reservePrice" 
                type="number" 
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Minimum price to sell (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyNowPrice">Buy Now Price (USD)</Label>
              <Input 
                id="buyNowPrice" 
                type="number" 
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Allow instant purchase (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bidIncrement">Bid Increment (USD) *</Label>
              <Select required defaultValue="10">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">$5</SelectItem>
                  <SelectItem value="10">$10</SelectItem>
                  <SelectItem value="25">$25</SelectItem>
                  <SelectItem value="50">$50</SelectItem>
                  <SelectItem value="100">$100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Auction Duration */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6">Auction Duration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select required defaultValue="7">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="5">5 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="10">10 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time</Label>
              <Input 
                id="startDate" 
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
        </Card>

        {/* Shipping */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6">Shipping</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Shipping Cost (USD) *</Label>
              <Input 
                id="shippingCost" 
                type="number" 
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingMethod">Shipping Method *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (5-7 days)</SelectItem>
                  <SelectItem value="express">Express (2-3 days)</SelectItem>
                  <SelectItem value="overnight">Overnight</SelectItem>
                  <SelectItem value="pickup">Local Pickup Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Item Location *</Label>
              <Input 
                id="location" 
                placeholder="City, State, Country"
                required
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate("/dashboard/seller")}
          >
            Cancel
          </Button>
          <Button type="submit">
            Create Auction
          </Button>
        </div>
      </form>
    </div>
  );
}
