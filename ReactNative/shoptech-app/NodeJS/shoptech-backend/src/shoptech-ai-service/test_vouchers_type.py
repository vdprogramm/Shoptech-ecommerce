import asyncio
import sys
from datetime import datetime
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

loose_vouchers = list(db.vouchers.find({"isActive": True}))
for v in loose_vouchers:
    print(v.get('code'), type(v.get('expirationDate')))

now = datetime.utcnow()
query = {
    "isActive": True,
    "expirationDate": {"$gte": now},
    "$expr": {"$lt": ["$usedCount", "$usageLimit"]}
}
print("Executing query:", query)
results = list(db.vouchers.find(query))
print("Query results:", len(results))
