const Notification = require("../models/Notification");

exports.getMyNotifications = async (req, res) => {
try {

const notifications = await Notification.find({
user: req.user._id
}).sort({ createdAt: -1 });

res.json(notifications);

} catch (error) {
res.status(500).json({ error: error.message });
}
};


exports.markAsRead = async (req, res) => {
try {

const notification = await Notification.findById(req.params.id);

notification.isRead = true;
await notification.save();

res.json(notification);

} catch (error) {
res.status(500).json({ error: error.message });
}
};