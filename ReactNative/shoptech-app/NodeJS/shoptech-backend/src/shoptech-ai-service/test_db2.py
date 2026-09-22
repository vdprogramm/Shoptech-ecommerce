from pymongo import MongoClient
import sys
sys.stdout.reconfigure(encoding='utf-8')
uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()
for p in db.products.find({}):
    print(p.get('name'), "-", p.get('price'))
