import asyncio
import sys
from datetime import datetime
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

now = datetime.utcnow()
print("Now:", now)

active_vouchers = list(db.vouchers.find({
    "isActive": True,
    "startTime": {"$lte": now},
    "endTime": {"$gte": now},
    "$expr": {"$lt": ["$usedCount", "$usageLimit"]}
}))
print("Active Vouchers (strict time):", len(active_vouchers))
for v in active_vouchers:
    print(v.get('code'), v.get('startTime'), v.get('endTime'))

loose_vouchers = list(db.vouchers.find({"isActive": True}))
print("Active Vouchers (loose):", len(loose_vouchers))
for v in loose_vouchers:
    print(v.get('code'), v.get('startTime'), v.get('endTime'))
