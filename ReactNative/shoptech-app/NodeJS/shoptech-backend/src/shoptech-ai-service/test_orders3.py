from pymongo import MongoClient
from bson import ObjectId
uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()
p = db.products.find_one({"_id": ObjectId("6a81531adebdbd6722fbef44")})
print(p.get('name') if p else 'Not found')
