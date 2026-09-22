import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient
import json
from bson import json_util
from datetime import datetime

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

now = datetime.utcnow()
print("Now:", now)

pipeline = [
    {"$match": {"isActive": True, "startTime": {"$lte": now}, "endTime": {"$gte": now}}},
    {"$unwind": "$items"},
    {"$lookup": {
        "from": "productvariants",
        "localField": "items.variant",
        "foreignField": "_id",
        "as": "variantInfo"
    }},
    {"$unwind": {"path": "$variantInfo", "preserveNullAndEmptyArrays": True}},
    {"$lookup": {
        "from": "products",
        "localField": "variantInfo.product",
        "foreignField": "_id",
        "as": "productInfo"
    }},
    {"$unwind": {"path": "$productInfo", "preserveNullAndEmptyArrays": True}}
]
fs_items = list(db.flashsales.aggregate(pipeline))

print("Active Flash Sales (strict time check):", len(fs_items))
for item in fs_items:
    print(item.get('campaignName'), item.get('productInfo', {}).get('name'))

# What if we only check isActive?
pipeline_loose = [
    {"$match": {"isActive": True}},
    {"$unwind": "$items"},
    {"$lookup": {
        "from": "productvariants",
        "localField": "items.variant",
        "foreignField": "_id",
        "as": "variantInfo"
    }},
    {"$unwind": {"path": "$variantInfo", "preserveNullAndEmptyArrays": True}},
    {"$lookup": {
        "from": "products",
        "localField": "variantInfo.product",
        "foreignField": "_id",
        "as": "productInfo"
    }},
    {"$unwind": {"path": "$productInfo", "preserveNullAndEmptyArrays": True}}
]
fs_items_loose = list(db.flashsales.aggregate(pipeline_loose))
print("Active Flash Sales (only isActive):", len(fs_items_loose))
for item in fs_items_loose:
    print(item.get('campaignName'), item.get('productInfo', {}).get('name'))
