from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from app.config import settings
from app.tools.shop_tools import search_products_by_keyword, get_store_policies


class ChatbotService:
    def __init__(self):
        # 1. Khởi tạo LLM chính (Gọi qua OpenRouter với model Gemma miễn phí của bạn)
        print(f"Đang khởi tạo AI Agent LLM: {settings.OPENROUTER_MODEL}...")
        self.llm = ChatOpenAI(
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=settings.OPENROUTER_API_KEY,
            model_name=settings.OPENROUTER_MODEL,
            temperature=0.1,
            max_tokens=2048,
            default_headers={
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "ShopTech AI Agent",
            }
        )

        # 2. Khai báo danh sách công cụ mà Agent được phép tự động sử dụng
        self.tools = [search_products_by_keyword, get_store_policies]

        # 3. Xây dựng System Prompt định hướng tư duy cho Agent
        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "Bạn là trợ lý ảo thông minh AI Agent của hệ thống thương mại điện tử ShopTech.\n"
                "Nhiệm vụ của bạn là tư vấn sản phẩm, tra cứu giá cả và giải đáp chính sách cho khách hàng.\n"
                "Bạn có quyền tự động gọi các công cụ (tools) được cung cấp để tra cứu dữ liệu chính xác từ hệ thống.\n"
                "QUY TẮC BẮT BUỘC:\n"
                "1. Khi khách hỏi về sản phẩm hoặc giá cả, BẢN THÂN PHẢI TỰ ĐỘNG GỌI CÔNG CỤ tìm kiếm, không được tự bịa đặt thông tin.\n"
                "2. Trả lời lịch sự, thân thiện, xưng 'Shop' và gọi khách là 'Bạn'."
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        # 4. Tạo Tool Calling Agent và AgentExecutor
        self.agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True  # Bật True để xem luồng Agent tự suy luận trên màn hình console
        )

    async def generate_response(self, current_message: str, store_id: str, history: list) -> str:
        """
        Hàm thay thế hoàn toàn cho logic cũ, chuyển đổi yêu cầu thành hành vi của AI Agent
        """
        try:
            # Chuyển đổi lịch sử chat (sliding window 6 tin nhắn gần nhất)
            MAX_HISTORY = 6
            recent_history = history[-MAX_HISTORY:] if len(history) > MAX_HISTORY else history

            formatted_history = []
            for msg in recent_history:
                # Kiểm tra định dạng object hoặc dict từ API request truyền vào
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
                elif final_role == "ai" or final_role == "assistant" or final_role == "model":
                    formatted_history.append(AIMessage(content=content))
                elif final_role == "system":
                    from langchain_core.messages import SystemMessage
                    formatted_history.append(SystemMessage(content=content))

            # Thực thi Agent xử lý câu hỏi
            response = self.agent_executor.invoke({
                "input": current_message,
                "chat_history": formatted_history
            })

            return response.get("output", "Xin lỗi bạn, Shop chưa hiểu rõ yêu cầu lắm.")

        except Exception as e:
            print(f"Lỗi AI Agent thực thi: {str(e)}")
            return "Xin lỗi bạn, hệ thống AI Agent đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!"


# Khởi tạo instance ở mức module giữ nguyên tên để không ảnh hưởng tới endpoints.py hiện tại
chatbot_service = ChatbotService()