from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from pymongo import MongoClient
from app.config import settings

# --- THAY ĐỔI 1: Import thư viện HuggingFace Endpoint ---
from langchain_huggingface import HuggingFaceEndpointEmbeddings

def format_currency(value):
    try:
        return "{:,.0f}".format(float(value)).replace(',', '.') + " ₫"
    except:
        return str(value) + " ₫"

class ChatbotService:
    def __init__(self):
        # 1. Kết nối MongoDB
        self.db_client = MongoClient(settings.MONGODB_URI)
        self.db = self.db_client.get_database()

        # 2. Khởi tạo mô hình nhúng (DÙNG API MIỄN PHÍ ĐỂ TIẾT KIỆM RAM)
        print(f"Connecting to Vector API: {settings.HF_EMBEDDING_MODEL}...")

        # --- THAY ĐỔI 2: Dùng HuggingFaceEndpointEmbeddings thay vì tải Local ---
        self.embeddings = HuggingFaceEndpointEmbeddings(
            model=settings.HF_EMBEDDING_MODEL,
            huggingfacehub_api_token=settings.HUGGINGFACEHUB_API_TOKEN
        )

        # 3. Khởi tạo LLM chính
        print(f"Connecting to LLM: {settings.OPENROUTER_MODEL}...")
        self.llm = ChatOpenAI(
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=settings.OPENROUTER_API_KEY,
            model_name=settings.OPENROUTER_MODEL,
            temperature=0.3,
            max_tokens=2048,
            model_kwargs={"frequency_penalty": 1.0, "presence_penalty": 0.5},
            max_retries=5,
            default_headers={
                "HTTP-Referer": "https://shoptech-api-ytxj.onrender.com",
                "X-Title": "ShopTech AI",
            }
        )

        # 4. KHỞI TẠO CƠ SỞ DỮ LIỆU VECTOR CHÍNH
        self.persist_directory = "./chroma_shoptech_db"
        self.vector_db = Chroma(
            collection_name="shoptech_global_products",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

        # 5. Tự động đồng bộ kho dữ liệu khi server khởi động
        self._sync_all_products_to_vector_db()

    def _sync_all_products_to_vector_db(self):
        """Hàm quét TOÀN BỘ sản phẩm của TẤT CẢ cửa hàng lưu vào Vector DB 1 lần"""
        print("Checking if Vector DB needs syncing...")

        try:
            # Kiểm tra xem DB đã có dữ liệu chưa để tránh xóa nhầm khi chạy nhiều worker trên Render
            existing_data = self.vector_db.get()
            if existing_data and len(existing_data.get('ids', [])) > 0:
                print(f"Vector DB already has {len(existing_data['ids'])} products, but forcing resync for formatting update.")
                # return (Bỏ qua return để force resync)
        except Exception:
            pass

        print("Syncing data from MongoDB to Vector DB...")
        try:
            self.vector_db.delete_collection()
        except Exception:
            pass

        self.vector_db = Chroma(
            collection_name="shoptech_global_products",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

        products = list(self.db.products.find({}))
        if not products:
            print("No products found in database.")
            return

        documents = []
        for p in products:
            name = p.get('name', 'Chưa rõ tên')
            price = p.get('price', 0)

            desc = str(p.get('description', ''))
            if len(desc) > 500:
                desc = desc[:500] + "..."

            store_id = str(p.get('store', 'default_store'))
            prod_id = str(p.get('_id'))
            
            # Lấy tên Danh mục & Thương hiệu (tạm lấy ID nếu chưa có map, nhưng ưu tiên tên)
            cat_id = p.get('category')
            brand_id = p.get('brand')
            cat_name = "Chưa rõ"
            brand_name = "Chưa rõ"
            if cat_id:
                try:
                    from bson.objectid import ObjectId
                    c_doc = self.db.categories.find_one({"_id": ObjectId(str(cat_id))})
                    if c_doc: cat_name = c_doc.get('name', 'Chưa rõ')
                except: pass
            if brand_id:
                try:
                    from bson.objectid import ObjectId
                    b_doc = self.db.brands.find_one({"_id": ObjectId(str(brand_id))})
                    if b_doc: brand_name = b_doc.get('name', 'Chưa rõ')
                except: pass

            raw_image = str(p.get('images', [''])[0] if p.get('images') else '')

            # --- ĐÃ SỬA: Dùng link Render thay vì localhost:3001 ---
            backend_render_url = "https://shoptech-api-ytxj.onrender.com"

            if raw_image and raw_image.startswith('data:image/'):
                image_url = f"{backend_render_url}/products/{prod_id}/image"
            elif raw_image and not raw_image.startswith('http'):
                clean_image_path = raw_image.lstrip('/')
                if clean_image_path.startswith('uploads/'):
                    clean_image_path = clean_image_path.replace('uploads/', '', 1)
                image_url = f"{backend_render_url}/uploads/{clean_image_path}"
            else:
                image_url = raw_image or "null"

            if len(image_url) > 500:
                image_url = "null"

            slug = p.get('slug', prod_id)

            img_markdown = f"![Ảnh sản phẩm]({image_url})\n\n" if image_url != "null" and image_url.startswith("http") else ""

            content = (
                f"**{name}**\n\n"
                f"Giá: {format_currency(price)}\n\n"
                f"Danh mục: {cat_name} | Thương hiệu: {brand_name}\n\n"
                f"Mô tả: {desc}\n\n"
                f"{img_markdown}"
                f"[Xem chi tiết và đặt hàng](/product/{slug})\n\n"
            )

            doc = Document(
                page_content=content,
                metadata={
                    "storeId": store_id,
                    "productId": prod_id,
                    "price": float(price) if isinstance(price, (int, float, str)) and str(price).isnumeric() else 0.0
                }
            )
            documents.append(doc)

        self.vector_db.add_documents(documents)
        print(f"Successfully synced {len(documents)} products to AI brain!")

    async def generate_response(self, current_message: str, store_id: str, user_id: str, history: list) -> str:
        search_kwargs = {"k": 6}

        is_global_search = (store_id is None or store_id == "default_store" or store_id == "")
        if not is_global_search:
            search_kwargs["filter"] = {"storeId": str(store_id)}

        search_results = self.vector_db.similarity_search(
            query=current_message,
            **search_kwargs
        )
        
        db_results = []
        user_behavior_context = ""
        user_name = "Khách hàng"
        
        # --- PRELOAD ACTIVE FLASH SALES ---
        flash_sale_map = {}
        try:
            from datetime import datetime
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
                {"$unwind": {"path": "$variantInfo", "preserveNullAndEmptyArrays": True}}
            ]
            fs_items = list(self.db.flashsales.aggregate(pipeline))
            for item in fs_items:
                var_info = item.get('variantInfo', {})
                prod_id = var_info.get('product')
                sale_price = item.get('items', {}).get('salePrice', 0)
                if prod_id:
                    flash_sale_map[str(prod_id)] = sale_price
        except Exception as e:
            print("Lỗi preload flash sale:", e)

        # --- RECOMMENDATION SYSTEM: LẤY HÀNH VI NGƯỜI DÙNG (GIỎ HÀNG & LỊCH SỬ MUA HÀNG) ---
        if user_id:
            try:
                from bson.objectid import ObjectId
                
                # Lấy tên khách hàng
                user_doc = self.db.users.find_one({"_id": ObjectId(user_id)})
                if user_doc and user_doc.get("fullName"):
                    user_name = user_doc.get("fullName")
                
                # 1. Đọc Giỏ hàng (Cart)
                cart = self.db.carts.find_one({"user": ObjectId(user_id)})
                if cart and cart.get('items'):
                    cart_items = cart.get('items', [])
                    cart_products = []
                    for item in cart_items:
                        variant_id = item.get('variant')
                        if variant_id:
                            variant = self.db.productvariants.find_one({"_id": ObjectId(str(variant_id))})
                            if variant and variant.get('product'):
                                product = self.db.products.find_one({"_id": variant.get('product')})
                                if product:
                                    cart_products.append(product.get('name', ''))
                    if cart_products:
                        cart_str = ", ".join(list(set(cart_products)))
                        user_behavior_context += f"- Khách đang có trong giỏ hàng: {cart_str}.\n"
                
                # 2. Đọc Đơn hàng gần nhất (Recent Order)
                last_order = self.db.orders.find_one({"user": ObjectId(user_id)}, sort=[("createdAt", -1)])
                if last_order:
                    order_items = []
                    for so in last_order.get('subOrders', []):
                        for item in so.get('items', []):
                            item_name = item.get('name', '')
                            if not item_name or item_name.lower() == 'sản phẩm':
                                try:
                                    p_doc = self.db.products.find_one({"_id": item.get('product')})
                                    if p_doc: item_name = p_doc.get('name', 'Sản phẩm')
                                except: pass
                            order_items.append(item_name)
                    if order_items:
                        order_str = ", ".join(list(set(order_items)))
                        user_behavior_context += f"- Gần đây khách đã mua: {order_str}.\n"
            except Exception as e:
                print("Lỗi hệ thống đề xuất:", e)

        # --- TÌM KIẾM ĐƠN HÀNG VÀ THỐNG KÊ (ORDER STATS) ---
        order_stats_keywords = ['hủy nhiều nhất', 'mua nhiều nhất', 'bán chạy nhất', 'thống kê đơn hàng', 'nhiều người mua', 'sản phẩm hot']
        is_asking_order_stats = any(kw in current_message.lower() for kw in order_stats_keywords)
        if is_asking_order_stats:
            try:
                # Top cancelled products
                cancelled_pipeline = [
                    {"$unwind": "$subOrders"},
                    {"$unwind": "$subOrders.items"},
                    {"$match": {"subOrders.status": "Cancelled"}},
                    {"$group": {"_id": "$subOrders.items.product", "count": {"$sum": "$subOrders.items.quantity"}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 3}
                ]
                top_cancelled = list(self.db.orders.aggregate(cancelled_pipeline))
                
                # Top completed products
                completed_pipeline = [
                    {"$unwind": "$subOrders"},
                    {"$unwind": "$subOrders.items"},
                    {"$match": {"subOrders.status": "Delivered"}},
                    {"$group": {"_id": "$subOrders.items.product", "count": {"$sum": "$subOrders.items.quantity"}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 3}
                ]
                top_completed = list(self.db.orders.aggregate(completed_pipeline))
                
                if top_completed:
                    for stat in top_completed:
                        p_doc = self.db.products.find_one({"_id": stat['_id']})
                        if p_doc:
                            db_results.append(f"**[BÁN CHẠY NHẤT] {p_doc.get('name', 'Sản phẩm')}**\n\n(Đã bán: {stat['count']} cái)")
                if top_cancelled:
                    for stat in top_cancelled:
                        p_doc = self.db.products.find_one({"_id": stat['_id']})
                        if p_doc:
                            db_results.append(f"**[HỦY NHIỀU NHẤT] {p_doc.get('name', 'Sản phẩm')}**\n\n(Đã hủy: {stat['count']} cái)")
            except Exception as e:
                print("Lỗi khi fetch order stats:", e)

        # --- TÌM KIẾM ĐƠN HÀNG NẾU NGƯỜI DÙNG HỎI ---
        order_keywords = ['đơn hàng', 'đơn mua', 'theo dõi đơn', 'tình trạng đơn', 'đơn của tôi', 'vận chuyển', 'đã giao', 'chưa giao', 'đang giao']
        is_asking_orders = any(kw in current_message.lower() for kw in order_keywords)
        
        if is_asking_orders and user_id:
            try:
                from bson.objectid import ObjectId
                recent_orders = list(self.db.orders.find(
                    {"user": ObjectId(user_id)}
                ).sort("createdAt", -1).limit(3))
                
                if recent_orders:
                    db_results.append("THÔNG TIN CÁC ĐƠN HÀNG GẦN ĐÂY CỦA KHÁCH HÀNG (Hãy tóm tắt và báo cáo tình trạng cho khách):")
                    for order in recent_orders:
                        code = order.get('orderCode', 'Không rõ')
                        total = order.get('totalAmount', 0)
                        
                        payment_status = order.get('paymentStatus', '')
                        if payment_status == 'Paid': payment_status = 'Đã thanh toán'
                        elif payment_status == 'Unpaid': payment_status = 'Chưa thanh toán'
                        
                        sub_orders = order.get('subOrders', [])
                        
                        items_str = []
                        all_statuses = []
                        for so in sub_orders:
                            s_status = so.get('status', 'Pending')
                            all_statuses.append(s_status)
                            for item in so.get('items', []):
                                item_name = item.get('name', '')
                                if not item_name or item_name.lower() == 'sản phẩm':
                                    try:
                                        p_doc = self.db.products.find_one({"_id": item.get('product')})
                                        if p_doc:
                                            item_name = p_doc.get('name', 'Sản phẩm')
                                    except: pass
                                items_str.append(f"{item_name} (x{item.get('quantity')})")
                        
                        summary_status = "Đang xử lý"
                        if "Cancelled" in all_statuses: summary_status = "Đã hủy"
                        elif "Shipped" in all_statuses: summary_status = "Đang giao hàng"
                        elif "Delivered" in all_statuses: summary_status = "Đã giao thành công"
                        
                        items_joined = ", ".join(items_str)
                        content = f"**[ĐƠN HÀNG] {code}**\n\nTrạng thái: **{summary_status}** | Thanh toán: {payment_status} | Tổng tiền: **{format_currency(total)}**\n\nSản phẩm: {items_joined}"
                        db_results.append(content)
                else:
                    db_results.append("Khách hàng hiện chưa có đơn hàng nào trong hệ thống, hoặc bạn chưa mua hàng.")
            except Exception as e:
                print("Lỗi khi fetch đơn hàng:", e)
        elif is_asking_orders and not user_id:
            db_results.append("Hệ thống yêu cầu: Khách hàng chưa đăng nhập. Hãy nhắc nhở khách hàng đăng nhập để tra cứu thông tin đơn hàng.")

        # --- TÌM KIẾM FLASH SALE NẾU NGƯỜI DÙNG HỎI ---
        flash_sale_keywords = ['flash sale', 'flashsale', 'sale', 'khuyến mãi', 'giảm giá', 'giá hời', 'ưu đãi']
        is_asking_flash_sale = any(kw in current_message.lower() for kw in flash_sale_keywords)

        if is_asking_flash_sale:
            try:
                from datetime import datetime
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
                fs_items = list(self.db.flashsales.aggregate(pipeline))
                
                if fs_items:
                    for item in fs_items[:10]:
                        campaign = item.get('campaignName', 'Flash Sale')
                        sale_price = item.get('items', {}).get('salePrice', 0)
                        prod = item.get('productInfo', {})
                        var_info = item.get('variantInfo', {})
                        if prod:
                            name = prod.get('name', 'Sản phẩm')
                            sku = var_info.get('sku', '')
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
                            
                            if len(image_url) > 500: image_url = "null"
                            img_markdown = f"![Ảnh sản phẩm]({image_url})\n\n" if image_url != "null" and image_url.startswith("http") else ""

                            content = (
                                f"**[FLASH SALE] {name}**\n\n"
                                f"Chương trình: {campaign}\n\n"
                                f"Giá Gốc: {format_currency(prod.get('price', 0))} -> **GIÁ FLASH SALE: {format_currency(sale_price)}**\n\n"
                                f"{img_markdown}"
                                f"[Xem chi tiết và đặt hàng](/product/{slug})\n\n"
                            )
                            db_results.append(content)
                else:
                    db_results.append("Hiện tại hệ thống không có chương trình Flash Sale hoặc sự kiện giảm giá nào đang diễn ra.")
            except Exception as e:
                print("Lỗi khi fetch flash sale:", e)

        # --- TÌM KIẾM CỬA HÀNG NẾU NGƯỜI DÙNG HỎI ---
        store_keywords = ['cửa hàng', 'shop', 'nhà cung cấp', 'gian hàng', 'đối tác']
        is_asking_stores = any(kw in current_message.lower() for kw in store_keywords)
        if is_asking_stores:
            try:
                active_stores = list(self.db.stores.find({"isActive": True}).limit(10))
                if active_stores:
                    for s in active_stores:
                        s_name = s.get('name', 'Cửa hàng')
                        s_addr = s.get('address', 'Đang cập nhật')
                        s_phone = s.get('phone', 'Đang cập nhật')
                        db_results.append(f"**[CỬA HÀNG] {s_name}**\n\nĐịa chỉ: {s_addr} | SĐT: {s_phone}")
                else:
                    db_results.append("Hiện tại chưa có cửa hàng nào đang hoạt động.")
            except Exception as e:
                print("Lỗi khi fetch stores:", e)

        # --- TÌM KIẾM VOUCHER NẾU NGƯỜI DÙNG HỎI ---
        voucher_keywords = ['voucher', 'mã giảm giá', 'coupon', 'code giảm giá']
        is_asking_vouchers = any(kw in current_message.lower() for kw in voucher_keywords)
        if is_asking_vouchers:
            try:
                from datetime import datetime
                now = datetime.utcnow()
                active_vouchers = list(self.db.vouchers.find({
                    "isActive": True,
                    "expirationDate": {"$gt": now},
                    "$expr": {"$lt": ["$usedCount", "$usageLimit"]}
                }).limit(5))
                if active_vouchers:
                    for v in active_vouchers:
                        code = v.get('code', '')
                        discount = v.get('discountAmount', 0)
                        dtype = v.get('discountType', 'fixed')
                        min_order = v.get('minOrderValue', 0)
                        discount_str = format_currency(discount) if dtype == 'fixed' else f"{discount}%"
                        db_results.append(f"**[VOUCHER] {code}**\n\nGiảm: {discount_str} | Áp dụng cho đơn từ: {format_currency(min_order)}")
                else:
                    db_results.append("Hiện tại hệ thống đã hết hoặc chưa có mã giảm giá (voucher) nào khả dụng.")
            except Exception as e:
                print("Lỗi khi fetch vouchers:", e)

        # --- TÌM KIẾM DANH MỤC NẾU NGƯỜI DÙNG HỎI ---
        category_keywords = ['danh mục', 'ngành hàng', 'loại sản phẩm']
        is_asking_categories = any(kw in current_message.lower() for kw in category_keywords)
        if is_asking_categories:
            try:
                categories = list(self.db.categories.find({}).limit(15))
                if categories:
                    for c in categories:
                        db_results.append(f"**[DANH MỤC] {c.get('name', '')}**")
            except Exception as e:
                print("Lỗi khi fetch categories:", e)

        # --- TÌM KIẾM THƯƠNG HIỆU NẾU NGƯỜI DÙNG HỎI ---
        brand_keywords = ['thương hiệu', 'hãng', 'brand']
        is_asking_brands = any(kw in current_message.lower() for kw in brand_keywords)
        if is_asking_brands:
            try:
                brands = list(self.db.brands.find({}).limit(15))
                if brands:
                    for b in brands:
                        db_results.append(f"**[THƯƠNG HIỆU] {b.get('name', '')}**")
            except Exception as e:
                print("Lỗi khi fetch brands:", e)

        # TÌM KIẾM KEYWORD TỪ MONGODB (Khắc phục lỗi Vector Search kém với tiếng Việt không dấu)
        try:
            # Lấy các từ khóa dài hơn 2 ký tự để search regex
            words = current_message.split()
            ignore_words = ['cho', 'tôi', 'mua', 'tìm', 'xem', 'cái', 'có', 'không', 'những', 'loại', 'sản', 'phẩm', 'các', 'một']
            search_terms = [w for w in words if len(w) >= 3 and w.lower() not in ignore_words]
            
            if search_terms:
                regex_queries = [{"name": {"$regex": term, "$options": "i"}} for term in search_terms]
                # Thêm tìm kiếm theo danh mục (category name) bằng cách join nếu cần, nhưng đơn giản nhất là map danh mục ở fallback
                query_filter = {"$or": regex_queries}
                if not is_global_search:
                    query_filter["store"] = store_id
                    
                db_products = list(self.db.products.find(query_filter).limit(5))
                
                for p in db_products:
                    name = p.get('name', 'Chưa rõ tên')
                    price = p.get('price', 0)
                    desc = str(p.get('description', ''))[:300]
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
                    
                    img_markdown = f"![Ảnh sản phẩm]({image_url})\n\n" if image_url != "null" and image_url.startswith("http") else ""
                    
                    fs_tag = ""
                    if str(p.get('_id')) in flash_sale_map:
                        fs_tag = f"🔥 ĐANG CÓ FLASH SALE CHỈ CÒN: {format_currency(flash_sale_map[str(p.get('_id'))])} (Giá gốc: {format_currency(price)})\n\n"

                    content = (
                        f"**{name}**\n\n"
                        f"{fs_tag}"
                        f"Giá: {format_currency(price)}\n\n"
                        f"Mô tả: {desc}\n\n"
                        f"{img_markdown}"
                        f"[Xem chi tiết và đặt hàng](/product/{slug})\n\n"
                    )
                    db_results.append(content)
        except Exception as e:
            print("Lỗi search DB fallback:", e)

        # Gộp kết quả Vector và DB Fallback
        combined_context = []
        if search_results:
            for doc in search_results:
                prod_id = doc.metadata.get('productId')
                content = doc.page_content
                if prod_id and str(prod_id) in flash_sale_map:
                    content += f"\n\n🔥 ĐANG CÓ FLASH SALE CHỈ CÒN: {format_currency(flash_sale_map[str(prod_id)])}\n"
                combined_context.append(f"- {content}")
        if db_results:
            combined_context.extend(db_results)
            
        # Xóa trùng lặp dựa trên Tên sản phẩm
        unique_context = list(set(combined_context))

        # Dành cho LLM: Gửi thông tin kèm ID (P1, P2,...) và Giá, Danh mục để LLM lọc
        llm_context_list = []
        markdown_map = {}
        
        for i, item in enumerate(unique_context):
            pid = f"[P{i+1}]"
            markdown_map[pid] = item
            
            # Trích xuất thông tin cơ bản cho LLM đọc
            lines = item.strip().split('\n')
            name = lines[0].replace('**', '').replace('-', '').strip()
            price = "Chưa rõ"
            cat_brand = "Chưa rõ"
            for line in lines:
                if line.startswith("Giá:") or line.startswith("Giá Gốc:"): price = line
                if line.startswith("Danh mục:"): cat_brand = line
            
            if name and not name.startswith('![') and not name.startswith('['):
                llm_context_list.append(f"{pid} - {name} ({price}, {cat_brand})")
            
        store_context_for_llm = "\n".join(llm_context_list) if llm_context_list else "Hiện tại không tìm thấy dữ liệu nào phù hợp."

        scope_text = "toàn bộ cửa hàng trên sàn" if is_global_search else f"cửa hàng {store_id}"
        user_identity = f"Khách hàng đang chat với bạn tên là: {user_name}." if user_id else "Khách hàng hiện tại là Khách vãng lai (chưa đăng nhập)."

        behavior_prompt = ""
        if user_behavior_context:
            behavior_prompt = (
                "THÔNG TIN HÀNH VI CỦA KHÁCH HÀNG (RẤT QUAN TRỌNG):\n"
                f"{user_behavior_context}\n"
                "-> HÃY DỰA VÀO ĐÂY ĐỂ ĐỀ XUẤT: Nếu khách chỉ chào hoặc hỏi chung chung, bạn HÃY CHỦ ĐỘNG nhắc đến các sản phẩm trong giỏ hàng hoặc lịch sử mua hàng để khơi gợi nhu cầu (Upsell/Cross-sell). Ví dụ: 'Chào bạn, Shop thấy bạn đang quan tâm [Tên SP] trong giỏ hàng...'\n\n"
            )

        system_instruction = (
            f"Bạn là trợ lý ảo thông minh ShopTech AI.\n"
            f"Bạn đang đại diện hỗ trợ tư vấn cho: {scope_text}.\n"
            f"{user_identity}\n\n"
            f"{behavior_prompt}"
            "DANH SÁCH DỮ LIỆU TÌM ĐƯỢC (Đã được đánh mã [P1], [P2]...):\n"
            f"---\n{store_context_for_llm}\n---\n\n"
            "QUY TẮC QUAN TRỌNG NHẤT BẠN PHẢI TUÂN THỦ:\n"
            "1. TƯ VẤN LINH HOẠT: Khi khách hỏi một sản phẩm chung chung (VD: Laptop), hãy phân tích và tư vấn sản phẩm phù hợp nhất trong danh sách.\n"
            "2. YÊU CẦU VỀ FLASH SALE: Nếu khách hàng đang hỏi về Flash Sale, khuyến mãi hoặc giảm giá, bạn CHỈ ĐƯỢC PHÉP giới thiệu các sản phẩm có nhãn [FLASH SALE] hoặc 🔥 ĐANG CÓ FLASH SALE. TUYỆT ĐỐI KHÔNG giới thiệu các sản phẩm bình thường khác nếu khách chỉ hỏi xem đồ giảm giá.\n"
            "3. CHỈ KHI TUYỆT ĐỐI KHÔNG CÓ BẤT KỲ DỮ LIỆU NÀO LIÊN QUAN: Bạn mới nói 'Dạ hiện tại Shop không có thông tin/sản phẩm nào phù hợp yêu cầu của bạn ạ.'\n"
            "4. CÁCH HIỂN THỊ SẢN PHẨM PHÙ HỢP: Sử dụng mã ID (ví dụ [P1], [P2]) để chèn sản phẩm. Ví dụ: 'Shop có [P1] và [P2] phù hợp ạ.'\n"
            "5. BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC tự viết tay chi tiết sản phẩm. Chỉ dùng mã [P1], [P2].\n"
            "6. Trả lời ngắn gọn, lịch sự."
        )
        langchain_messages = [SystemMessage(content=system_instruction)]

        MAX_HISTORY = 20
        recent_history = history[-MAX_HISTORY:] if len(history) > MAX_HISTORY else history

        for msg in recent_history:
            if isinstance(msg, dict):
                role = msg.get("role", msg.get("sender", ""))
                content = msg.get("content", "")
            else:
                role = getattr(msg, "role", getattr(msg, "sender", ""))
                content = getattr(msg, "content", "")

            if role == "user":
                langchain_messages.append(HumanMessage(content=content))
            elif role in ["ai", "assistant"]:
                langchain_messages.append(AIMessage(content=content))

        langchain_messages.append(HumanMessage(content=current_message))

        try:
            response = self.llm.invoke(langchain_messages)
            clean_reply = response.content.replace("<pad>", "").strip()

            # Thay thế các mã [P1], [P2] bằng khối Markdown thực tế
            for pid, markdown in markdown_map.items():
                if pid in clean_reply:
                    # Chèn một đường kẻ và cách dòng cho đẹp
                    markdown_formatted = f"\n\n---\n{markdown}\n---"
                    clean_reply = clean_reply.replace(pid, markdown_formatted)

            # Nếu LLM quên dùng mã mà tự sinh ra list rỗng, xử lý fallback nếu cần
            # Nhưng tốt nhất là tin tưởng LLM sẽ dùng mã.
            
            return clean_reply

        except Exception as e:
            error_msg = str(e)
            print(f"Lỗi gọi LLM chính: {error_msg}")

            if "429" in error_msg or "rate_limit" in error_msg.lower():
                return "Xin lỗi bạn, hiện tại có quá nhiều khách hàng đang nhờ Shop tư vấn nên hệ thống hơi quá tải một chút. Bạn vui lòng đợi khoảng 20 giây rồi nhắn lại câu hỏi giúp Shop nhé! 🥺"

            return "Xin lỗi bạn, hệ thống AI đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!"


chatbot_service = ChatbotService()