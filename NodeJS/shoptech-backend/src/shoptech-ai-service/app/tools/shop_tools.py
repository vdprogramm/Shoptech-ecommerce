from langchain_core.tools import tool
from pymongo import MongoClient
from app.config import settings
from datetime import datetime
from bson.objectid import ObjectId

# Khởi tạo kết nối MongoDB
db_client = MongoClient(settings.MONGODB_URI)
db = db_client.get_database()

@tool
def search_products(keyword: str, store_id: str = None) -> str:
    """
    Tìm kiếm sản phẩm trong cơ sở dữ liệu dựa trên từ khóa.
    Sử dụng khi khách hàng hỏi về một sản phẩm cụ thể, mua sắm, giá cả.
    :param keyword: Từ khóa tìm kiếm sản phẩm.
    :param store_id: (Optional) Mã cửa hàng nếu khách hàng đang chat trong phạm vi 1 cửa hàng.
    """
    try:
        words = keyword.split()
        search_terms = [w for w in words if len(w) >= 3 and w.lower() not in ['cho', 'tôi', 'mua', 'tìm', 'xem', 'cái', 'có', 'không']]
        if not search_terms:
            search_terms = [keyword]

        regex_queries = [{"name": {"$regex": term, "$options": "i"}} for term in search_terms]
        query_filter = {"$or": regex_queries, "isAvailable": True}
        
        if store_id and store_id != "default_store":
            query_filter["store"] = store_id
            
        products = list(db.products.find(query_filter).limit(6))

        if not products:
            return f"Không tìm thấy sản phẩm nào khớp với từ khóa: '{keyword}'."

        result = "Danh sách sản phẩm tìm thấy:\n"
        for p in products:
            slug = p.get('slug', str(p.get('_id')))
            raw_image = str(p.get('images', [''])[0] if p.get('images') else '')
            backend_render_url = "https://shoptech-api-ytxj.onrender.com"
            if raw_image and raw_image.startswith('data:image/'):
                image_url = f"{backend_render_url}/products/{p.get('_id')}/image?ext=.jpg"
            elif raw_image and not raw_image.startswith('http'):
                clean = raw_image.lstrip('/')
                if clean.startswith('uploads/'): clean = clean.replace('uploads/', '', 1)
                image_url = f"{backend_render_url}/uploads/{clean}"
            else:
                image_url = raw_image or "null"

            result += (
                f"- Tên: {p.get('name')} | Giá: {p.get('price')} VNĐ | "
                f"Link ảnh: {image_url} | Link đặt hàng: /product/{slug}\n"
            )
        return result
    except Exception as e:
        return f"Lỗi khi tìm kiếm sản phẩm: {str(e)}"

@tool
def get_active_flash_sales() -> str:
    """
    Lấy thông tin các chương trình Flash Sale, giảm giá, giá hời đang diễn ra.
    Sử dụng khi khách hàng hỏi về sale, flash sale, khuyến mãi.
    """
    try:
        now = datetime.utcnow()
        pipeline = [
            {"$match": {"isActive": True, "startTime": {"$lte": now}, "endTime": {"$gte": now}}},
            {"$unwind": "$items"},
            {"$lookup": {
                "from": "productvariants",
                "localField": "items.variant",
                "foreignField": "_id",
                "as": "variantInfo"
            }},
            {"$unwind": {"path": "$variantInfo", "preserveNullAndEmptyArrays": True}},
            {"$lookup": {
                "from": "products",
                "localField": "variantInfo.product",
                "foreignField": "_id",
                "as": "productInfo"
            }},
            {"$unwind": {"path": "$productInfo", "preserveNullAndEmptyArrays": True}}
        ]
        fs_items = list(db.flashsales.aggregate(pipeline))
        
        if not fs_items:
            return "Hiện tại không có chương trình Flash Sale nào đang diễn ra."
            
        result = "THÔNG TIN FLASH SALE ĐANG DIỄN RA:\n"
        for item in fs_items[:8]:
            campaign = item.get('campaignName', 'Flash Sale')
            sale_price = item.get('items', {}).get('salePrice', 0)
            prod = item.get('productInfo', {})
            if prod:
                name = prod.get('name', 'Sản phẩm')
                slug = prod.get('slug', str(prod.get('_id')))
                raw_image = str(prod.get('images', [''])[0] if prod.get('images') else '')
                backend_render_url = "https://shoptech-api-ytxj.onrender.com"
                if raw_image and raw_image.startswith('data:image/'):
                    image_url = f"{backend_render_url}/products/{prod.get('_id')}/image?ext=.jpg"
                elif raw_image and not raw_image.startswith('http'):
                    clean = raw_image.lstrip('/')
                    if clean.startswith('uploads/'): clean = clean.replace('uploads/', '', 1)
                    image_url = f"{backend_render_url}/uploads/{clean}"
                else:
                    image_url = raw_image or "null"

                result += (
                    f"- Chương trình {campaign} | {name} | Giá Sale: {sale_price} VNĐ (Gốc: {prod.get('price')} VNĐ) | "
                    f"Link ảnh: {image_url} | Link đặt hàng: /product/{slug}\n"
                )
        return result
    except Exception as e:
        return f"Lỗi khi lấy thông tin flash sale: {str(e)}"

@tool
def get_user_orders(user_id: str) -> str:
    """
    Lấy thông tin các đơn hàng gần đây của khách hàng đang chat.
    Sử dụng khi khách hàng hỏi về đơn hàng của họ, theo dõi đơn, vận chuyển.
    :param user_id: ID của khách hàng.
    """
    if not user_id or user_id == "null" or user_id == "":
        return "Khách hàng chưa đăng nhập. Yêu cầu khách hàng đăng nhập để tra cứu đơn hàng."
        
    try:
        recent_orders = list(db.orders.find(
            {"user": ObjectId(user_id)}
        ).sort("createdAt", -1).limit(3))
        
        if not recent_orders:
            return "Khách hàng hiện chưa có đơn hàng nào trong hệ thống."
            
        result = "THÔNG TIN CÁC ĐƠN HÀNG GẦN ĐÂY:\n"
        for order in recent_orders:
            code = order.get('orderCode', 'Không rõ')
            total = order.get('totalAmount', 0)
            payment = order.get('paymentStatus', '')
            if payment == 'Paid': payment = 'Đã thanh toán'
            elif payment == 'Unpaid': payment = 'Chưa thanh toán'
            
            sub_orders = order.get('subOrders', [])
            items_str = []
            all_statuses = []
            for so in sub_orders:
                all_statuses.append(so.get('status', 'Pending'))
                for item in so.get('items', []):
                    items_str.append(f"{item.get('name')} (x{item.get('quantity')})")
            
            status = "Đang xử lý"
            if "Cancelled" in all_statuses: status = "Đã hủy"
            elif "Shipped" in all_statuses: status = "Đang giao hàng"
            elif "Delivered" in all_statuses: status = "Đã giao thành công"
            
            result += f"- Mã đơn: {code} | Trạng thái: {status} | Thanh toán: {payment} | Tổng: {total}đ | Sản phẩm: {', '.join(items_str)}\n"
        return result
    except Exception as e:
        return f"Lỗi khi lấy thông tin đơn hàng: {str(e)}"

@tool
def get_active_vouchers() -> str:
    """
    Lấy danh sách các mã giảm giá (voucher) công khai đang có hiệu lực.
    Sử dụng khi khách hàng hỏi xin mã giảm giá, voucher.
    """
    try:
        now = datetime.utcnow()
        vouchers = list(db.vouchers.find({
            "isPublic": True,
            "isActive": True,
            "startDate": {"$lte": now},
            "endDate": {"$gte": now}
        }).limit(5))
        
        if not vouchers:
            return "Hiện tại không có mã giảm giá công khai nào."
            
        result = "CÁC MÃ GIẢM GIÁ ĐANG CÓ:\n"
        for v in vouchers:
            code = v.get('code')
            discount = v.get('discountAmount', 0)
            dtype = v.get('discountType', 'fixed')
            minOrder = v.get('minOrderValue', 0)
            if dtype == 'percent':
                result += f"- Mã: {code} (Giảm {discount}%, đơn tối thiểu {minOrder}đ)\n"
            else:
                result += f"- Mã: {code} (Giảm {discount}đ, đơn tối thiểu {minOrder}đ)\n"
        return result
    except Exception as e:
        return f"Lỗi khi lấy thông tin voucher: {str(e)}"

@tool
def get_store_policies() -> str:
    """
    Cung cấp thông tin về chính sách bảo hành, đổi trả, và giao hàng.
    Sử dụng khi khách hàng hỏi về bảo hành, vận chuyển, đổi trả.
    """
    return (
        "Chính sách chính thức của ShopTech:\n"
        "1. Bảo hành: Đồ điện tử bảo hành 12 tháng chính hãng.\n"
        "2. Đổi trả: Hỗ trợ 1 đổi 1 trong vòng 30 ngày nếu có lỗi nhà sản xuất.\n"
        "3. Vận chuyển: Miễn phí giao hàng cho mọi đơn hàng từ 2.000.000 VNĐ."
    )