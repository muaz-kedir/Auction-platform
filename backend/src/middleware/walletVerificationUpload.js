const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../../uploads/wallet-verifications");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `wallet-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const walletVerificationUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = [".pdf", ".jpg", ".jpeg", ".png"];

    if (allowedMimeTypes.includes(file.mimetype) && allowedExt.includes(ext)) {
      return cb(null, true);
    }

    cb(new Error("Only .pdf, .jpg, .jpeg, and .png files are allowed"));
  },
});

module.exports = { walletVerificationUpload };
