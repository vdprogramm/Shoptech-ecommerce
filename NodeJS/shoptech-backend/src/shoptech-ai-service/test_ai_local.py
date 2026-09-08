import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from app.services.chatbot_service import chatbot_service

async def main():
    print("Asking AI: 'sản phẩm flashsale'")
    response = await chatbot_service.generate_response("sản phẩm flashsale", None, None, [])
    print("\n--- AI RESPONSE ---")
    print(response)
    print("-------------------")

if __name__ == "__main__":
    asyncio.run(main())
