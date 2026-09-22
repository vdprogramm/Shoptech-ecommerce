import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from app.services.chatbot_service import chatbot_service

async def main():
    print("Testing Recommendation System...")
    # Dùng user_id có sẵn từ DB (đã mua hàng trước đó)
    user_id = "6a2708eb16203756b522dd58"
    
    reply = await chatbot_service.generate_response(
        current_message="Chào shop, tư vấn cho mình vài món đồ công nghệ đi",
        store_id="default_store",
        user_id=user_id,
        history=[]
    )
    print("\n--- AI RESPONSE ---")
    print(reply)
    print("-------------------")

if __name__ == "__main__":
    asyncio.run(main())
