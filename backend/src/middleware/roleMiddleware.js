const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }
    next();
  };
};

// Admin only (admin or super_admin)
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }
  next();
};

// Super admin only
const superAdminOnly = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({
      message: "Super admin access required"
    });
  }
  next();
};

module.exports = { authorize, adminOnly, superAdminOnly };