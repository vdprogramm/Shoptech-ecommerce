const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb+srv://dringd49k:D9Xm645Xm7nS7RkM@cluster0.n1b3s.mongodb.net/shoptech_db');
    const db = mongoose.connection.db;
    const recentVariants = await db.collection('productvariants').find().sort({_id: -1}).limit(5).toArray();
    console.log("Recent variants imageUrls:");
    recentVariants.forEach(v => {
      let img = v.imageUrl ? (v.imageUrl.length > 50 ? v.imageUrl.substring(0, 50) + "..." : v.imageUrl) : "NONE";
      console.log("- SKU: " + v.sku + ", imageUrl: " + img);
    });
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
