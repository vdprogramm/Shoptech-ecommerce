from pymongo import MongoClient
import sys
sys.stdout.reconfigure(encoding='utf-8')
uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

orders = list(db.orders.find({"orderCode": {"$in": ["ORD753220", "ORD739711", "ORD972887"]}}))
for o in orders:
    print(f"Order: {o.get('orderCode')}")
    for so in o.get('subOrders', []):
        for item in so.get('items', []):
            print(f" - Item Name: {item.get('name')}")
