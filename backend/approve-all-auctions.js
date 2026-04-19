// Script to approve all pending auctions
require('dotenv').config();
const mongoose = require('mongoose');
const Auction = require('./src/models/Auction');

async function approveAllAuctions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Find all pending auctions
    const pendingAuctions = await Auction.find({
      approvalStatus: { $in: ['PENDING', 'SUBMITTED'] }
    });

    console.log(`\nFound ${pendingAuctions.length} pending auctions`);

    if (pendingAuctions.length === 0) {
      console.log('No auctions to approve');
      process.exit(0);
    }

    // Approve all auctions
    for (const auction of pendingAuctions) {
      auction.approvalStatus = 'APPROVED';
      auction.status = 'ACTIVE';
      await auction.save();
      console.log(`✓ Approved: ${auction.title} (ID: ${auction._id})`);
    }

    console.log(`\n✓ Successfully approved ${pendingAuctions.length} auctions!`);
    console.log('These auctions will now appear on the home page.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

approveAllAuctions();
