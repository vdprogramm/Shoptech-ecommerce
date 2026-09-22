from pymongo import MongoClient

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

print("Total products:", db.products.count_documents({}))
print("Total products with isAvailable=True:", db.products.count_documents({"isAvailable": True}))
print("Total products with name 'điện thoại':", db.products.count_documents({"name": {"$regex": "điện", "$options": "i"}}))
