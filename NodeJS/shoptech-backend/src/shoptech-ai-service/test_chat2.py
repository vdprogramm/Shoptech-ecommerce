import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')

from app.services.chatbot_service import chatbot_service

async def main():
    print("Testing response...")
    reply = await chatbot_service.generate_response(
        current_message="Tư vấn điện thoại dưới 10 triệu",
        store_id="default_store",
        user_id=None,
        history=[]
    )
    print("\n--- AI RESPONSE ---")
    print(reply)
    print("-------------------")

if __name__ == "__main__":
    asyncio.run(main())
