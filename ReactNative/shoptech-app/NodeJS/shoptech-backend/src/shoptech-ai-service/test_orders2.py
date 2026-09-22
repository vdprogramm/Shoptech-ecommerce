from pymongo import MongoClient
import sys
import json
from bson import json_util
sys.stdout.reconfigure(encoding='utf-8')
uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

order = db.orders.find_one({"orderCode": "ORD739711"})
print(json.dumps(order, default=json_util.default, indent=2, ensure_ascii=False))
