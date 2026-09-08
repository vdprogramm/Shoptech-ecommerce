from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Any
from app.services.chatbot_service import chatbot_service
from app.services.recommend_service import recommend_service

# 🔴 SỬA ĐỔI: Định nghĩa chuẩn prefix khớp với cổng gọi từ NestJS
router = APIRouter(prefix="/api/chatbot", tags=["AI Engineering Modules"])


# 👉 ĐÃ SỬA: Mở rộng để chấp nhận cả 'role' (NestJS) và 'sender' (Cũ)
class MessageDTO(BaseModel):
    role: Optional[str] = None
    sender: Optional[str] = None
    content: str


class ChatInput(BaseModel):
    # 👉 ĐÃ SỬA: Thêm 'message' vì NestJS có gửi field này trong body
    message: Optional[str] = None
    current_message: str

    # 🔴 SỬA ĐỔI: Chuyển thành Optional để tránh crash nếu phía Client/NestJS chưa truyền storeId
    store_id: Optional[str] = "default_store"
    user_id: Optional[str] = None

    # 👉 ĐÃ SỬA: Cho phép history là mảng rỗng [] nếu chưa có lịch sử chat
    history: Optional[List[MessageDTO]] = []


class ProductInput(BaseModel):
    id: str
    store: Optional[str] = "default_store"  # Chuyển thành Optional để linh hoạt scope
    name: str
    category: str
    brand: str
    price: float


class RecommendInput(BaseModel):
    target_product_id: str
    all_products: List[ProductInput]


@router.post("/chat")
async def chat_endpoint(payload: ChatInput):
    """
    API tiếp nhận tin nhắn hội thoại:
    URL: http://localhost:8000/api/chatbot/chat
    """
    try:
        # 👉 BẢO VỆ DỮ LIỆU: Ưu tiên lấy current_message, nếu rỗng thì lấy message
        msg_text = payload.current_message if payload.current_message else payload.message

        # Giả định hàm generate_response của bạn là hàm đồng bộ hoặc bất đồng bộ.
        # Nếu hàm gốc không phải async, hãy bỏ chữ await đi nhé.
        reply_text = await chatbot_service.generate_response(
            current_message=msg_text,
            store_id=payload.store_id,
            user_id=payload.user_id,
            history=payload.history
        )
        return {"reply": reply_text}
    except Exception as e:
        print(f"CRITICAL ERROR [NLP Chat]: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi phân hệ NLP: {str(e)}")


@router.post("/recommend")
async def recommend_endpoint(
        payload: RecommendInput,
        store_id: Optional[str] = Query(None, alias="storeId")
):
    """
    API gợi ý sản phẩm thông minh:
    URL: http://localhost:8000/api/chatbot/recommend
    """
    try:
        recommended_product_ids = recommend_service.calculate_recommendations(
            target_id=payload.target_product_id,
            all_products=payload.all_products,
            scope_store_id=store_id,
            limit=4
        )
        return {"recommended_ids": recommended_product_ids}
    except Exception as e:
        print(f"CRITICAL ERROR [Machine Learning Recommend]: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi phân hệ Machine Learning: {str(e)}")