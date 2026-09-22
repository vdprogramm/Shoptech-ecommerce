from langchain_core.tools import tool
from pymongo import MongoClient
from app.config import settings

# Khởi tạo kết nối MongoDB riêng cho các tools độc lập
db_client = MongoClient(settings.MONGODB_URI)
db = db_client.get_database()


@tool
def search_products_by_keyword(keyword: str) -> str:
    """
    Tìm kiếm sản phẩm trong cơ sở dữ liệu MongoDB dựa trên từ khóa tên hoặc mô tả.
    Sử dụng công cụ này khi khách hàng hỏi về một sản phẩm cụ thể (ví dụ: iPhone, Samsung, laptop...).
    """
    try:
        query = {
            "$or": [
                {"name": {"$regex": keyword, "$options": "i"}},
                {"description": {"$regex": keyword, "$options": "i"}}
            ]
        }
        products = list(db.products.find(query).limit(5))

        if not products:
            return f"Không tìm thấy sản phẩm nào khớp với từ khóa: '{keyword}' trong hệ thống."

        result = "Danh sách sản phẩm tìm thấy từ cơ sở dữ liệu:\n"
        for p in products:
            result += f"- Tên: {p.get('name')} | Giá: {p.get('price')} VNĐ | Mô tả: {p.get('description', 'Không có mô tả')}\n"
        return result
    except Exception as e:
        return f"Lỗi khi truy vấn cơ sở dữ liệu sản phẩm: {str(e)}"


@tool
def get_store_policies() -> str:
    """
    Cung cấp thông tin về chính sách bảo hành, đổi trả, và giao hàng của cửa hàng ShopTech.
    Sử dụng công cụ này khi khách hàng hỏi về bảo hành, vận chuyển, hoặc quy định mua hàng.
    """
    return (
        "Chính sách chính thức của ShopTech:\n"
        "1. Bảo hành: Toàn bộ điện thoại và máy tính được bảo hành chính hãng 12 tháng.\n"
        "2. Đổi trả: Hỗ trợ 1 đổi 1 trong vòng 30 ngày đầu nếu phát sinh lỗi từ nhà sản xuất.\n"
        "3. Vận chuyển: Miễn phí giao hàng toàn quốc cho các đơn hàng có giá trị từ 2.000.000 VNĐ trở lên."
    )