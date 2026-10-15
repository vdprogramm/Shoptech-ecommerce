async function test() {
  try {
    const storesRes = await fetch('https://shoptech-api-ytxj.onrender.com/stores');
    const stores = await storesRes.json();
    const dienGiaDung = stores.find(s => s.name === 'Điện gia dụng');
    console.log('Store Điện gia dụng ID:', dienGiaDung._id);

    const productsRes = await fetch(`https://shoptech-api-ytxj.onrender.com/products?store=${dienGiaDung._id}`);
    const products = await productsRes.json();
    console.log(`Products in store: ${products.length}`);
    for (const p of products) {
      console.log(`- Product: ${p.name}, store: ${typeof p.store}, variants:`, p.variants ? p.variants.length : 0);
      if (p.variants && p.variants.length > 0) {
        console.log(`  First variant type: ${typeof p.variants[0]}`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
