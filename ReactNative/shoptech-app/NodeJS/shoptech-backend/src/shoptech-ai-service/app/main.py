import uvicorn
from fastapi import FastAPI
from app.api.endpoints import router as ai_router
from app.config import settings

app = FastAPI(
    title="ShopTech Core AI/ML Enterprise Service",
    description="Hệ thống Microservice đảm nhiệm thuật toán Học Sâu (Deep Learning) và Chuỗi Đại Lý AI (LangChain Agents)",
    version="3.0.0"
)

# 🔴 SỬA ĐỔI: Đổi prefix thành rỗng để ăn theo cấu trúc định nghĩa chi tiết bên trong endpoints.py
app.include_router(ai_router, prefix="")

@app.get("/")
def health_check():
    """Endpoint kiểm tra trạng thái sống sót của Microservice AI"""
    return {
        "status": "Healthy",
        "service": "ShopTech AI/ML Core",
        "embedding_engine": "Vietnamese-SBERT (Local)",
        "llm_gateway": "OpenRouter"
    }

if __name__ == "__main__":
    print(f"🚀 Hệ thống AI/ML đang khởi động tại cổng: {settings.FASTAPI_PORT}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.FASTAPI_PORT, reload=True)