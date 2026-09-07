from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from pymongo import MongoClient
from app.config import settings

# --- THAY ĐỔI 1: Import thư viện HuggingFace Endpoint ---
from langchain_huggingface import HuggingFaceEndpointEmbeddings


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

            content = (
                f"**{name}**\n"
                f"Giá: {price} VNĐ\n"
                f"Mô tả: {desc}\n\n"
                f"![Ảnh sản phẩm]({image_url})\n\n"
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
                                items_str.append(f"{item.get('name')} (x{item.get('quantity')})")
                        
                        summary_status = "Đang xử lý"
                        if "Cancelled" in all_statuses: summary_status = "Đã hủy"
                        elif "Shipped" in all_statuses: summary_status = "Đang giao hàng"
                        elif "Delivered" in all_statuses: summary_status = "Đã giao thành công"
                        
                        items_joined = ", ".join(items_str)
                        content = f"- Mã đơn: {code} | Trạng thái: {summary_status} | Thanh toán: {payment_status} | Tổng tiền: {total}đ | Sản phẩm: {items_joined}"
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
                    db_results.append("THÔNG TIN SỰ KIỆN FLASH SALE / GIÁ HỜI ĐANG DIỄN RA (Ưu tiên tư vấn):")
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

                            content = (
                                f"**{name}** (Chương trình: {campaign})\n"
                                f"Giá Gốc: {prod.get('price', 0)} VNĐ -> **GIÁ FLASH SALE: {sale_price} VNĐ**\n\n"
                                f"![Ảnh sản phẩm]({image_url})\n\n"
                                f"[Xem chi tiết và đặt hàng](/product/{slug})\n\n"
                            )
                            db_results.append(content)
                else:
                    db_results.append("Hiện tại hệ thống không có chương trình Flash Sale hoặc sự kiện giảm giá nào đang diễn ra.")
            except Exception as e:
                print("Lỗi khi fetch flash sale:", e)

        # TÌM KIẾM KEYWORD TỪ MONGODB (Khắc phục lỗi Vector Search kém với tiếng Việt không dấu)
        try:
            # Lấy các từ khóa dài hơn 2 ký tự để search regex
            words = current_message.split()
            search_terms = [w for w in words if len(w) >= 3 and w.lower() not in ['cho', 'tôi', 'mua', 'tìm', 'xem', 'cái', 'có', 'không', 'những', 'loại']]
            
            if search_terms:
                regex_queries = [{"name": {"$regex": term, "$options": "i"}} for term in search_terms]
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

                    content = (
                        f"**{name}**\n"
                        f"Giá: {price} VNĐ\n"
                        f"Mô tả: {desc}\n\n"
                        f"![Ảnh sản phẩm]({image_url})\n\n"
                        f"[Xem chi tiết và đặt hàng](/product/{slug})\n\n"
                    )
                    db_results.append(content)
        except Exception as e:
            print("Lỗi search DB fallback:", e)

        # Gộp kết quả Vector và DB Fallback
        combined_context = []
        if search_results:
            combined_context.extend([f"- {doc.page_content}" for doc in search_results])
        if db_results:
            combined_context.extend(db_results)
            
        # Xóa trùng lặp dựa trên Tên sản phẩm
        unique_context = list(set(combined_context))

        if unique_context:
            store_context = "\n".join(unique_context)
        else:
            store_context = "Hiện tại không tìm thấy dữ liệu sản phẩm nào phù hợp với yêu cầu trong hệ thống."

        scope_text = "toàn bộ cửa hàng trên sàn" if is_global_search else f"cửa hàng {store_id}"
        user_identity = f"Mã ID của khách hàng đang chat là: {user_id}." if user_id else "Khách hàng hiện tại là Khách vãng lai (chưa đăng nhập)."

        system_instruction = (
            f"Bạn là trợ lý ảo thông minh ShopTech AI.\n"
            f"Bạn đang đại diện hỗ trợ tư vấn cho: {scope_text}.\n"
            f"{user_identity}\n\n"
            "DỮ LIỆU SẢN PHẨM HIỆN CÓ CỦA HỆ THỐNG:\n"
            f"---\n{store_context}\n---\n\n"
            "QUY TẮC QUAN TRỌNG NHẤT:\n"
            "1. Dữ liệu sản phẩm ở trên ĐÃ ĐƯỢC ĐỊNH DẠNG SẴN BẰNG MARKDOWN (gồm Tên, Giá, Ảnh, Link đặt hàng).\n"
            "2. BẠN BẮT BUỘC PHẢI COPY Y NGUYÊN từng khối Markdown của các sản phẩm đó vào câu trả lời của bạn. Tuyệt đối không được gộp chung, không được tự ý tóm tắt bỏ mất link ảnh (`![Ảnh sản phẩm](...)`) và link mua hàng (`[Xem chi tiết...](...)`). MỖI SẢN PHẨM PHẢI HIỂN THỊ ĐẦY ĐỦ ẢNH VÀ LINK RIÊNG!\n"
            "3. Trả lời lịch sự, xưng 'Shop' gọi 'Bạn'."
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
            return clean_reply

        except Exception as e:
            error_msg = str(e)
            print(f"Lỗi gọi LLM chính: {error_msg}")

            if "429" in error_msg or "rate_limit" in error_msg.lower():
                return "Xin lỗi bạn, hiện tại có quá nhiều khách hàng đang nhờ Shop tư vấn nên hệ thống hơi quá tải một chút. Bạn vui lòng đợi khoảng 20 giây rồi nhắn lại câu hỏi giúp Shop nhé! 🥺"

            return "Xin lỗi bạn, hệ thống AI đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!"


chatbot_service = ChatbotService()