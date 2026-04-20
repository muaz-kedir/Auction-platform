const mongoose = require("mongoose");
const Category = require("./src/models/Category");
require("dotenv").config();

const defaultCategories = [
  "Home",
  "Vehicle", 
  "Watch",
  "Art",
  "Electronics"
];

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/online_auction_platform";

async function seedCategories() {
  try {
    console.log("Connecting to MongoDB...");
    console.log("URI:", MONGO_URI.replace(/:([^:@]+)@/, ":****@")); // Hide password in logs
    
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected\n");

    let created = 0;
    let skipped = 0;

    for (const name of defaultCategories) {
      const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      
      if (existing) {
        console.log(`Category "${name}" already exists, skipping...`);
        skipped++;
      } else {
        await Category.create({ name });
        console.log(`✅ Created category: "${name}"`);
        created++;
      }
    }

    console.log(`\n✅ Done! Created ${created} categories, skipped ${skipped} existing.`);
    console.log("\nCurrent categories in database:");
    const allCategories = await Category.find().sort({ name: 1 });
    allCategories.forEach(cat => console.log(`  - ${cat.name}`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedCategories();
