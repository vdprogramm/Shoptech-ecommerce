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
        print(f"Đang kết nối API trích xuất vector: {settings.HF_EMBEDDING_MODEL}...")

        # --- THAY ĐỔI 2: Dùng HuggingFaceEndpointEmbeddings thay vì tải Local ---
        self.embeddings = HuggingFaceEndpointEmbeddings(
            model=settings.HF_EMBEDDING_MODEL,
            huggingfacehub_api_token=settings.HUGGINGFACEHUB_API_TOKEN
        )

        # 3. Khởi tạo LLM chính
        print(f"Đang kết nối LLM: {settings.OPENROUTER_MODEL}...")
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
        print("Đang đồng bộ dữ liệu từ MongoDB sang Vector DB...")

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
            print("Không có sản phẩm nào trong database.")
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
            frontend_url = "http://localhost:8080"

            content = (
                f"Sản phẩm: {name}. "
                f"Cửa hàng ID: {store_id}. "
                f"Giá: {price} VNĐ. "
                f"Mô tả: {desc}. "
                f"\nLINK ẢNH: {image_url}\n"
                f"LINK ĐẶT HÀNG: {frontend_url}/product/{slug}\n"
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
        print(f"Đã đồng bộ {len(documents)} sản phẩm vào bộ não AI thành công!")

    async def generate_response(self, current_message: str, store_id: str, user_id: str, history: list) -> str:
        search_kwargs = {"k": 6}

        is_global_search = (store_id is None or store_id == "default_store" or store_id == "")
        if not is_global_search:
            search_kwargs["filter"] = {"storeId": str(store_id)}

        search_results = self.vector_db.similarity_search(
            query=current_message,
            **search_kwargs
        )

        # TÌM KIẾM KEYWORD TỪ MONGODB (Khắc phục lỗi Vector Search kém với tiếng Việt không dấu)
        db_results = []
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
                        f"Sản phẩm: {name}. Cửa hàng ID: {p.get('store', 'default')}. Giá: {price} VNĐ. "
                        f"Mô tả: {desc}. \nLINK ẢNH: {image_url}\nLINK ĐẶT HÀNG: http://localhost:8080/product/{slug}\n"
                    )
                    db_results.append(f"- {content}")
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
            "QUY TẮC QUAN TRỌNG:\n"
            "1. CHỈ TƯ VẤN SẢN PHẨM khớp chính xác với từ khóa hoặc yêu cầu của khách hàng. Tuyệt đối không đề xuất sản phẩm không liên quan (ví dụ: khách hỏi tai nghe thì KHÔNG giới thiệu chuột).\n"
            "2. Nếu trong DỮ LIỆU SẢN PHẨM không có sản phẩm nào khớp với yêu cầu của khách, hãy thông báo 'Shop hiện tại chưa có sản phẩm này', không gượng ép gợi ý.\n"
            "3. Trả lời lịch sự, thân thiện, xưng 'Shop' gọi 'Bạn', ngắn gọn và đúng trọng tâm.\n"
            "4. KHI GỢI Ý SẢN PHẨM: Trình bày thông tin sản phẩm bằng Markdown chuẩn như sau (Tuyệt đối KHÔNG dùng ngoặc vuông [] bọc link ảnh):\n"
            "**Tên sản phẩm**\n"
            "Giá: Giá VNĐ\n"
            "Mô tả: Mô tả ngắn\n\n"
            "![Ảnh sản phẩm](LINK ẢNH TỪ DỮ LIỆU)\n\n"
            "[Xem chi tiết và đặt hàng](LINK ĐẶT HÀNG TỪ DỮ LIỆU)"
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