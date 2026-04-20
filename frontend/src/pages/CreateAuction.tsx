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
import { Upload, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api } from "../services/api";

interface Category {
  _id: string;
  name: string;
}

export function CreateAuction() {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    customCategory: "",
    condition: "",
    startingBid: "",
    reservePrice: "",
    buyNowPrice: "",
    bidIncrement: "10",
    duration: "7",
    startDate: new Date().toISOString().slice(0, 16),
    shippingCost: "",
    shippingMethod: "",
    location: "",
  });
  const [isOtherCategory, setIsOtherCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories...");
      const response = await api.categories.getAll();
      console.log("Raw response:", JSON.stringify(response, null, 2));
      
      // Handle various response formats
      let categoriesData: Category[] = [];
      
      if (Array.isArray(response)) {
        categoriesData = response;
        console.log("Response is array, length:", response.length);
      } else if (response && Array.isArray(response.categories)) {
        categoriesData = response.categories;
      } else if (response && typeof response === 'object') {
        // Try to find any array in the response
        const possibleArrays = Object.values(response).filter(v => Array.isArray(v));
        if (possibleArrays.length > 0) {
          categoriesData = possibleArrays[0] as Category[];
        }
      }
      
      // Validate categories data
      if (!Array.isArray(categoriesData) || categoriesData.length === 0) {
        console.warn("No categories found, using fallback");
        // Fallback default categories
        categoriesData = [
          { _id: "home", name: "Home" },
          { _id: "vehicle", name: "Vehicle" },
          { _id: "watch", name: "Watch" },
          { _id: "art", name: "Art" },
          { _id: "electronics", name: "Electronics" },
        ];
      }
      
      console.log("Final categories:", categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories - using defaults");
      // Set fallback categories on error
      setCategories([
        { _id: "home", name: "Home" },
        { _id: "vehicle", name: "Vehicle" },
        { _id: "watch", name: "Watch" },
        { _id: "art", name: "Art" },
        { _id: "electronics", name: "Electronics" },
      ]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalImages = images.length + newFiles.length;

    if (totalImages > 8) {
      toast.error("Maximum 8 images allowed");
      return;
    }

    // Add files
    setImages((prev) => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${newFiles.length} image(s) uploaded`);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("You are not logged in. Please login again.");
      navigate('/login');
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
      toast.error("Starting bid must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      // Calculate end time based on duration
      const startDate = new Date(formData.startDate);
      const endTime = new Date(startDate);
      endTime.setDate(endTime.getDate() + parseInt(formData.duration));

      let categoryId = formData.category;

      // If "Other" is selected, create the custom category first
      if (formData.category === "other" && formData.customCategory.trim()) {
        try {
          const newCategory = await api.admin.createCategory(formData.customCategory.trim());
          categoryId = newCategory.category._id;
          toast.success(`Category "${formData.customCategory}" created successfully`);
        } catch (catError: any) {
          // If category already exists, fetch it and use its ID
          if (catError.message?.includes("already exists")) {
            const allCategories = await api.categories.getAll();
            const existingCat = allCategories.find((c: Category) => 
              c.name.toLowerCase() === formData.customCategory.trim().toLowerCase()
            );
            if (existingCat) {
              categoryId = existingCat._id;
            }
          } else {
            throw catError;
          }
        }
      }

      console.log("Submitting auction with:", {
        title: formData.title,
        description: formData.description,
        category: categoryId,
        startingBid: formData.startingBid,
        endTime: endTime.toISOString(),
        imageCount: images.length
      });

      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      
      // Only add category if selected
      if (categoryId && categoryId !== "other") {
        submitData.append("category", categoryId);
      }
      
      submitData.append("startingBid", formData.startingBid);
      submitData.append("endTime", endTime.toISOString());

      // Add images
      images.forEach((image) => {
        submitData.append("images", image);
      });

      const response = await api.auctions.create(submitData);
      console.log("Auction created:", response);

      toast.success("Auction created successfully!", {
        description: "Your auction is pending approval.",
      });
      navigate("/dashboard/seller");
    } catch (error: any) {
      console.error("Failed to create auction:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to create auction";
      
      // If unauthorized, suggest re-login
      if (errorMessage.includes("token") || errorMessage.includes("authorized") || errorMessage.includes("Invalid token")) {
        toast.error("Your session has expired. Please login again.", {
          action: {
            label: "Login",
            onClick: () => navigate('/login')
          }
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
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
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => {
                  handleInputChange("category", value);
                  setIsOtherCategory(value === "other");
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={categories.length === 0 ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      No categories found. Please refresh.
                    </SelectItem>
                  ) : (
                    <>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other" className="border-t border-border/50 mt-1 pt-1 font-medium text-primary">
                        + Other (Custom)
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="text-xs text-destructive">
                  Categories not loading? <Button variant="link" size="sm" className="h-auto p-0" onClick={fetchCategories}>Click to retry</Button>
                </p>
              )}
            </div>

            {/* Custom Category Input - Shows when "Other" is selected */}
            {isOtherCategory && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="customCategory">Custom Category *</Label>
                <Input 
                  id="customCategory" 
                  placeholder="Enter your custom category name"
                  value={formData.customCategory}
                  onChange={(e) => handleInputChange("customCategory", e.target.value)}
                  required={isOtherCategory}
                />
                <p className="text-xs text-muted-foreground">
                  This category will be reviewed by the admin before your auction is approved.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select 
                value={formData.condition}
                onValueChange={(value) => handleInputChange("condition", value)}
              >
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
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
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
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border/50">
                  <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Cover
                    </div>
                  )}
                </div>
              ))}
              {images.length < 8 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Upload</span>
                </label>
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
                value={formData.startingBid}
                onChange={(e) => handleInputChange("startingBid", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservePrice">Reserve Price (USD)</Label>
              <Input 
                id="reservePrice" 
                type="number" 
                placeholder="0.00"
                value={formData.reservePrice}
                onChange={(e) => handleInputChange("reservePrice", e.target.value)}
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
                value={formData.buyNowPrice}
                onChange={(e) => handleInputChange("buyNowPrice", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Allow instant purchase (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bidIncrement">Bid Increment (USD) *</Label>
              <Select 
                value={formData.bidIncrement}
                onValueChange={(value) => handleInputChange("bidIncrement", value)}
                required
              >
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
              <Select 
                value={formData.duration}
                onValueChange={(value) => handleInputChange("duration", value)}
                required
              >
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
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Shipping */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6">Shipping (Optional)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Shipping Cost (USD)</Label>
              <Input 
                id="shippingCost" 
                type="number" 
                placeholder="0.00"
                value={formData.shippingCost}
                onChange={(e) => handleInputChange("shippingCost", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingMethod">Shipping Method</Label>
              <Select 
                value={formData.shippingMethod}
                onValueChange={(value) => handleInputChange("shippingMethod", value)}
              >
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
              <Label htmlFor="location">Item Location</Label>
              <Input 
                id="location" 
                placeholder="City, State, Country"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
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
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Auction"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
