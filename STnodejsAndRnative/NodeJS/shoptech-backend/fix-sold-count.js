const mongoose = require('mongoose');

async function fixSoldCount() {
  await mongoose.connect('mongodb://localhost:27017/shoptech');
  const db = mongoose.connection;
  
  console.log('Calculating soldCount...');
  const orders = await db.collection('orders').find({}).toArray();
  const soldCounts = {};
  
  for (const order of orders) {
    if (!order.subOrders || !Array.isArray(order.subOrders)) continue;
    for (const subOrder of order.subOrders) {
      if (subOrder.status !== 'Cancelled') { 
        if (!subOrder.items || !Array.isArray(subOrder.items)) continue;
        for (const item of subOrder.items) {
          const productId = item.product ? item.product.toString() : null;
          if (productId) {
            if (!soldCounts[productId]) soldCounts[productId] = 0;
            soldCounts[productId] += item.quantity || 1;
          }
        }
      }
    }
  }
  
  for (const [productId, count] of Object.entries(soldCounts)) {
    await db.collection('products').updateOne(
      { _id: new mongoose.Types.ObjectId(productId) },
      { $set: { soldCount: count }, $unset: { '\`$set': "" } }
    );
  }

  // Set 0 for products that have never been sold
  await db.collection('products').updateMany(
    { soldCount: { $exists: false } },
    { $set: { soldCount: 0 } }
  );

  console.log('Updated soldCount for ' + Object.keys(soldCounts).length + ' products with actual sales.');
  console.log('Set soldCount to 0 for remaining products.');
  process.exit(0);
}

fixSoldCount().catch(console.error);
