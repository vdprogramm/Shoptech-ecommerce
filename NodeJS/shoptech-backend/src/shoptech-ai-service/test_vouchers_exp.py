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

loose_vouchers = list(db.vouchers.find({"isActive": True}))
for v in loose_vouchers:
    print(v.get('code'), v.get('expirationDate'), v.get('usedCount'), v.get('usageLimit'))
