import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

# Find one cancelled order
order = db.orders.find_one({"status": "Cancelled"})
if not order:
    order = db.orders.find_one({"subOrders.status": "Cancelled"})

print(f"Cancelled Order: {order}")
