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
import { Upload, X, Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { api } from "../services/api";
import { getImageUrl } from "../utils/imageUtils";

interface Category {
  _id: string;
  name: string;
}

export function EditAuction() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    startingBid: "",
    endTime: "",
  });

  useEffect(() => {
    if (id) {
      fetchCategories();
      fetchAuction();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.categories.getAll();
      let categoriesData: Category[] = [];
      
      if (Array.isArray(response)) {
        categoriesData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.categories)) {
          categoriesData = response.categories;
        } else if (Array.isArray(response.data)) {
          categoriesData = response.data;
        }
      }
      
      setCategories(categoriesData);
    } catch (error: any) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchAuction = async () => {
    try {
      setFetching(true);
      const auction = await api.auctions.getById(id!);
      
      setFormData({
        title: auction.title || "",
        description: auction.description || "",
        category: auction.category?._id || "",
        startingBid: auction.startingBid?.toString() || "",
        endTime: auction.endTime ? new Date(auction.endTime).toISOString().slice(0, 16) : "",
      });
      
      setExistingImages(auction.images || []);
    } catch (error: any) {
      console.error("Failed to fetch auction:", error);
      toast.error("Failed to load auction");
      navigate("/dashboard/my-auctions");
    } finally {
      setFetching(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newFiles]);
      
      // Create previews
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      setLoading(true);
      
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description);
      submitFormData.append("startingBid", formData.startingBid);
      submitFormData.append("endTime", formData.endTime);
      if (formData.category) {
        submitFormData.append("category", formData.category);
      }

      // Add existing images that weren't removed
      existingImages.forEach((img) => {
        submitFormData.append("existingImages", img);
      });

      // Add new images
      images.forEach((image) => {
        submitFormData.append("images", image);
      });

      await api.auctions.update(id, submitFormData);
      
      toast.success("Auction updated successfully!");
      navigate("/dashboard/my-auctions");
    } catch (error: any) {
      console.error("Failed to update auction:", error);
      toast.error(error.response?.data?.message || "Failed to update auction");
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/my-auctions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Auction</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Item Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter item title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your item"
              rows={4}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startingBid">Starting Bid ($)</Label>
              <Input
                id="startingBid"
                type="number"
                value={formData.startingBid}
                onChange={(e) => setFormData({ ...formData, startingBid: e.target.value })}
                placeholder="Enter starting bid"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Current Images:</p>
                <div className="flex flex-wrap gap-4">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={getImageUrl(img)}
                        alt={`Existing ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">New Images:</p>
                <div className="flex flex-wrap gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="images"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload images
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/my-auctions")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Auction"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
