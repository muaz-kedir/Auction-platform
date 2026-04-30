const Announcement = require("../models/Announcement");
const { sendNotificationToBuyers } = require("../utils/firebase");

// Get all announcements
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { visibility, isActive } = req.query;
    
    const query = {};
    if (visibility) query.visibility = visibility;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const announcements = await Announcement.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single announcement
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ announcement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    console.log("📝 Creating announcement with data:", req.body);
    console.log("👤 User ID:", req.user?._id);

    const { title, content, visibility } = req.body;

    if (!title || !content) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "Title and content are required" });
    }

    console.log("📢 Creating announcement in database...");
    const announcement = await Announcement.create({
      title,
      content,
      visibility: visibility || "homepage",
      createdBy: req.user._id
    });

    console.log("✅ Announcement created with ID:", announcement._id);

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate("createdBy", "name email");

    console.log("📢 Sending push notification to buyers...");
    // Send push notification to all buyers
    await sendNotificationToBuyers(
      title,
      content,
      { url: "/announcements" }
    );

    console.log("✅ Announcement creation complete");
    res.status(201).json({
      message: "Announcement created successfully",
      announcement: populatedAnnouncement
    });
  } catch (error) {
    console.error("❌ Error creating announcement:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, content, visibility, isActive } = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, content, visibility, isActive },
      { new: true }
    ).populate("createdBy", "name email");

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({
      message: "Announcement updated successfully",
      announcement
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
