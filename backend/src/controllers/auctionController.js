const Auction = require("../models/Auction");

exports.createAuction = async (req, res) => {
try {

const images = req.files
? req.files.map(file => file.path)
: [];

// Get startingBid from either field
const startingBid = req.body.startingBid || req.body.startingPrice;

// Build auction data - only include category if it's a valid ObjectId
const auctionData = {
title: req.body.title,
description: req.body.description,
startingBid: Number(startingBid),
currentBid: Number(startingBid),
endTime: req.body.endTime,
seller: req.user._id,
images
};

// Only add category if it's a valid 24-character hex ObjectId
if (req.body.category && /^[0-9a-fA-F]{24}$/.test(req.body.category)) {
auctionData.category = req.body.category;
}

const auction = await Auction.create(auctionData);

res.status(201).json(auction);

} catch (error) {
res.status(500).json({ error: error.message });
}
};

exports.getAuctions = async (req, res) => {
try {

const { search, category, min, max } = req.query;

let filter = {};

if (search) {
filter.title = {
$regex: search,
$options: "i"
};
}

if (category) {
filter.category = category;
}

if (min || max) {
filter.currentBid = {};

if (min) filter.currentBid.$gte = min;
if (max) filter.currentBid.$lte = max;
}

const auctions = await Auction.find(filter)
.populate("seller")
.populate("category")
.sort({ createdAt: -1 });

res.json(auctions);

} catch (error) {
res.status(500).json({ error: error.message });
}
};

exports.getAuctionById = async (req, res) => {
try {

const auction = await Auction.findById(req.params.id)
.populate("seller")
.populate("category");

res.json(auction);

} catch (error) {
res.status(500).json({ error: error.message });
}
};