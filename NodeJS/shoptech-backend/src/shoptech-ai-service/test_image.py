import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

product = db.products.find_one({"name": {"$regex": "HyperX", "$options": "i"}})
if product:
    print(f"Name: {product.get('name')}")
    img = product.get('image', '')
    print(f"Image length: {len(img)}")
    print(f"Image snippet: {img[:100]}...")
else:
    print("Product not found")
