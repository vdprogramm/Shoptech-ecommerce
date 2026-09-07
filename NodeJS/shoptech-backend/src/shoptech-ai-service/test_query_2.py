from pymongo import MongoClient

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

p = db.products.find_one({})
print("First product keys:", p.keys() if p else "None")
if p:
    print("name:", p.get('name'))
    print("isAvailable:", p.get('isAvailable'))
    
print("Total with isAvailable True:", db.products.count_documents({"isAvailable": True}))
print("Total with isAvailable False/Null:", db.products.count_documents({"isAvailable": {"$ne": True}}))

keyword = "Tư vấn điện thoại dưới 10 triệu"
words = keyword.split()
search_terms = [w for w in words if len(w) >= 3 and w.lower() not in ['cho', 'tôi', 'mua', 'tìm', 'xem', 'cái', 'có', 'không']]
regex_queries = [{"name": {"$regex": term, "$options": "i"}} for term in search_terms]
query_filter = {"$or": regex_queries}

print("Matched products without isAvailable:", db.products.count_documents(query_filter))

