import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient
import json
from bson import json_util

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

cancelled_pipeline = [
    {"$unwind": "$subOrders"},
    {"$unwind": "$subOrders.items"},
    {"$match": {"subOrders.status": "Cancelled"}},
    {"$group": {"_id": "$subOrders.items.product", "count": {"$sum": "$subOrders.items.quantity"}}},
    {"$sort": {"count": -1}},
    {"$limit": 3}
]
top_cancelled = list(db.orders.aggregate(cancelled_pipeline))
print("TOP CANCELLED:", top_cancelled)

completed_pipeline = [
    {"$unwind": "$subOrders"},
    {"$unwind": "$subOrders.items"},
    {"$match": {"subOrders.status": "Delivered"}},
    {"$group": {"_id": "$subOrders.items.product", "count": {"$sum": "$subOrders.items.quantity"}}},
    {"$sort": {"count": -1}},
    {"$limit": 3}
]
top_completed = list(db.orders.aggregate(completed_pipeline))
print("TOP COMPLETED:", top_completed)
