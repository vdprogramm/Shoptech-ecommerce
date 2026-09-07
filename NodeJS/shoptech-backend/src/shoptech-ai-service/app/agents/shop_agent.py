from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.config import settings
from app.tools.shop_tools import (
    search_products, 
    get_active_flash_sales, 
    get_user_orders, 
    get_active_vouchers, 
    get_store_policies
)

class ChatbotService:
    def __init__(self):
        print(f"Đang khởi tạo AI Agent LLM: {settings.OPENROUTER_MODEL}...")
        self.llm = ChatOpenAI(
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=settings.OPENROUTER_API_KEY,
            model_name=settings.OPENROUTER_MODEL,
            temperature=0.1,
            max_tokens=2048,
            default_headers={
                "HTTP-Referer": "https://shoptech-api-ytxj.onrender.com",
                "X-Title": "ShopTech AI Agent",
            }
        )

        self.tools = [
            search_products, 
            get_active_flash_sales, 
            get_user_orders, 
            get_active_vouchers, 
            get_store_policies
        ]

        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "Bạn là trợ lý ảo thông minh AI Agent của hệ thống thương mại điện tử ShopTech.\n"
                "Nhiệm vụ của bạn là tư vấn sản phẩm, quản lý đơn hàng, thông báo flash sale/khuyến mãi và giải đáp chính sách.\n"
                "THÔNG TIN HIỆN TẠI:\n"
                "- Mã khách hàng (user_id): {user_id}\n"
                "- Mã cửa hàng đang xem (store_id): {store_id}\n\n"
                "QUY TẮC BẮT BUỘC:\n"
                "1. Bạn PHẢI sử dụng các công cụ (tools) được cung cấp để tra cứu dữ liệu (như tìm sản phẩm, kiểm tra đơn hàng, xem flash sale).\n"
                "2. Tuyệt đối KHÔNG tự bịa ra thông tin sản phẩm, giá cả, mã đơn hàng hay mã giảm giá.\n"
                "3. Khi tư vấn sản phẩm/flash sale, hãy trình bày kèm ảnh và link mua hàng (nếu có từ tool) bằng Markdown chuẩn: `![Tên](Link ảnh)` và `[Xem chi tiết và đặt hàng](Link đặt hàng)`.\n"
                "4. Trả lời lịch sự, thân thiện, xưng 'Shop' và gọi khách là 'Bạn'."
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        self.agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True
        )

    async def generate_response(self, current_message: str, store_id: str, user_id: str, history: list) -> str:
        try:
            MAX_HISTORY = 6
            recent_history = history[-MAX_HISTORY:] if len(history) > MAX_HISTORY else history

            formatted_history = []
            for msg in recent_history:
                if hasattr(msg, "dict"):
                    msg_dict = msg.dict()
                elif hasattr(msg, "model_dump"):
                    msg_dict = msg.model_dump()
                elif isinstance(msg, dict):
                    msg_dict = msg
                else:
                    msg_dict = msg.__dict__ if hasattr(msg, "__dict__") else {}

                final_role = msg_dict.get("role") or msg_dict.get("sender")
                content = msg_dict.get("content") or ""

                if final_role == "user" or final_role == "human":
                    formatted_history.append(HumanMessage(content=content))
                elif final_role in ["ai", "assistant", "model"]:
                    formatted_history.append(AIMessage(content=content))
                elif final_role == "system":
                    formatted_history.append(SystemMessage(content=content))

            # Thực thi Agent xử lý câu hỏi
            response = await self.agent_executor.ainvoke({
                "input": current_message,
                "chat_history": formatted_history,
                "user_id": user_id if user_id else "Khách vãng lai (null)",
                "store_id": store_id if store_id else "default_store"
            })

            clean_reply = response.get("output", "Xin lỗi bạn, Shop chưa hiểu rõ yêu cầu lắm.")
            return clean_reply.replace("<pad>", "").strip()

        except Exception as e:
            print(f"Lỗi AI Agent thực thi: {str(e)}")
            return "Xin lỗi bạn, hệ thống AI Agent đang gặp sự cố kỹ thuật (hoặc quá tải). Bạn vui lòng thử lại sau nhé!"

chatbot_service = ChatbotService()