// Standardized image URL helper
// Handles Cloudinary URLs, local uploads, and relative paths

// Detect the appropriate API URL based on current environment
const getApiUrl = (): string => {
  // Check if VITE_API_URL is explicitly set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check current origin to determine which backend to use
  const currentOrigin = window.location.origin;
  
  // Production deployments
  if (currentOrigin.includes('vercel.app')) {
    return 'https://auction-platform-expk.vercel.app';
  }
  
  // Default to localhost for development
  return 'http://localhost:5000';
};

const API_URL = getApiUrl();
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500";

/**
 * Convert image path to proper URL
 * - Cloudinary URLs (http/https) - return as-is
 * - Local uploads (/uploads/) - prepend API URL
 * - Relative paths - prepend /uploads/ and API URL
 * - Empty/invalid - return placeholder
 */
export const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return PLACEHOLDER_IMAGE;
  
  // If it's already a full URL (Cloudinary, external, or data URI), return as-is
  if (imagePath.startsWith('http://') || 
      imagePath.startsWith('https://') || 
      imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Handle file:// paths (convert to local path)
  if (imagePath.startsWith('file://')) {
    const filename = imagePath.split(/[\\/]/).pop();
    if (filename) {
      return `${API_URL}/uploads/${filename}`;
    }
    return PLACEHOLDER_IMAGE;
  }
  
  // Handle absolute Windows paths
  if (imagePath.includes(':\\') || imagePath.includes(':/')) {
    const filename = imagePath.split(/[\\/]/).pop();
    if (filename) {
      return `${API_URL}/uploads/${filename}`;
    }
    return PLACEHOLDER_IMAGE;
  }
  
  // Handle /uploads/ paths
  if (imagePath.startsWith('/uploads/')) {
    return `${API_URL}${imagePath}`;
  }
  
  // Handle paths starting with uploads/ (without leading slash)
  if (imagePath.startsWith('uploads/')) {
    return `${API_URL}/${imagePath}`;
  }
  
  // Assume it's just a filename, prepend /uploads/
  return `${API_URL}/uploads/${imagePath}`;
};

/**
 * Process multiple images for gallery/slider display
 */
export const processImages = (images: string[] | undefined): string[] => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [PLACEHOLDER_IMAGE];
  }
  return images.map(img => getImageUrl(img));
};

export default { getImageUrl, processImages };
