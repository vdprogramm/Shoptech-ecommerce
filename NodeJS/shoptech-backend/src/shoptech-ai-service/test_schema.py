import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pymongo import MongoClient
import json
from bson import json_util

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

print("--- FLASHSALE ---")
fs = db.flashsales.find_one()
print(json.dumps(fs, default=json_util.default, ensure_ascii=False, indent=2))

print("\n--- VOUCHERS ---")
v = db.vouchers.find_one()
print(json.dumps(v, default=json_util.default, ensure_ascii=False, indent=2))

print("\n--- STORES ---")
s = db.stores.find_one()
print(json.dumps(s, default=json_util.default, ensure_ascii=False, indent=2))
