const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { isCloudinaryConfigured } = require("../middleware/cloudinaryUpload");

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic info
    if (name) user.name = name;
    
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Handle profile image upload
    if (req.file) {
      if (req.file.path && req.file.path.startsWith('http')) {
        // Cloudinary URL
        user.profileImage = req.file.path;
      } else if (req.file.filename) {
        // Local file path
        user.profileImage = `/uploads/${req.file.filename}`;
      }
    }

    await user.save();

    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      verified: user.verified,
      isBanned: user.isBanned
    };

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary URL
      user.profileImage = req.file.path;
    } else if (req.file.filename) {
      // Local file path
      user.profileImage = `/uploads/${req.file.filename}`;
    }
    
    await user.save();

    res.json({
      message: "Profile image uploaded successfully",
      profileImage: user.profileImage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
