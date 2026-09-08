import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient
import json
from bson import json_util

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

print("--- PRODUCT VARIANTS ---")
pv = db.productvariants.find_one()
print(json.dumps(pv, default=json_util.default, ensure_ascii=False, indent=2))
