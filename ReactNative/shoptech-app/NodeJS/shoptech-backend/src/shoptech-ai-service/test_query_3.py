from pymongo import MongoClient
import sys

# Change standard output encoding
sys.stdout.reconfigure(encoding='utf-8')

uri = "mongodb+srv://vinh:Vinh123456@cluster0.qvqrd7u.mongodb.net/shoptech?appName=Cluster0"
client = MongoClient(uri)
db = client.get_database()

keyword = "Tư vấn điện thoại dưới 10 triệu"
words = keyword.split()
search_terms = [w for w in words if len(w) >= 3 and w.lower() not in ['cho', 'tôi', 'mua', 'tìm', 'xem', 'cái', 'có', 'không']]
regex_queries = [{"name": {"$regex": term, "$options": "i"}} for term in search_terms]

query_filter = {"$or": regex_queries, "isAvailable": True}
products = list(db.products.find(query_filter).limit(6))
print(f"Match count for {keyword}:", len(products))
for p in products:
    print("-", p.get('name'))

print("---")
# Test with regex on "dưới"
print("Match count for 'dưới':", db.products.count_documents({"name": {"$regex": "dưới", "$options": "i"}}))
print("Match count for 'triệu':", db.products.count_documents({"name": {"$regex": "triệu", "$options": "i"}}))
