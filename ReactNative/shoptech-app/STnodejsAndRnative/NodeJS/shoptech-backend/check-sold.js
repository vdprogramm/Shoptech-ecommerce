const mongoose = require('mongoose');
async function check() {
  await mongoose.connect('mongodb://localhost:27017/shoptech');
  const db = mongoose.connection;
  const products = await db.collection('products').find({soldCount: {$gt: 0}}).sort({soldCount: -1}).toArray();
  console.log('Products with soldCount > 0:');
  console.log(products.map(p => ({name: p.name, soldCount: p.soldCount})));
  process.exit(0);
}
check().catch(console.error);
