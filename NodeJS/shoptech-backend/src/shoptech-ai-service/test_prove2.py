import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient
from bson import ObjectId

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

user_id = "6a2708eb16203756b522dd58"
cart = db.carts.find_one({"user": ObjectId(user_id)})
print(f"Cart: {cart}")
