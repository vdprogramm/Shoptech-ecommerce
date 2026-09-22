import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from app.services.chatbot_service import ChatbotService

async def main():
    service = ChatbotService()
    user_message = "cho tôi xem những mã voucher"
    
    print(f"User asking: {user_message}")
    response = await service.generate_response(
        current_message=user_message,
        user_id="6655c4217117b35f29910d6e",
        store_id="67a216c59c5d1bb9e54d85a1",
        history=[]
    )
    print("\n--- AI RESPONSE ---")
    print(response)

if __name__ == "__main__":
    asyncio.run(main())
