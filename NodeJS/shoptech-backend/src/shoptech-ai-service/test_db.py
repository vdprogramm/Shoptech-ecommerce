from pymongo import MongoClient
import sys

sys.stdout.reconfigure(encoding='utf-8')

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

products = list(db.products.find({"name": {"$regex": "Điện thoại 123", "$options": "i"}}))
print(f"Found {len(products)} products matching 'Điện thoại 123'")
for p in products:
    print(f"Name: {p.get('name')}")
    print(f"Price: {p.get('price')}")
    print(f"Images: {p.get('images')}")

products2 = list(db.products.find({"name": {"$regex": "Điều hòa", "$options": "i"}}))
print(f"\nFound {len(products2)} products matching 'Điều hòa'")
for p in products2:
    print(f"Name: {p.get('name')}")
    print(f"Price: {p.get('price')}")
    print(f"Images: {p.get('images')}")
