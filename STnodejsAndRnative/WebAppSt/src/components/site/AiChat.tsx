import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
// 🔴 IMPORT DỊCH VỤ API RIÊNG
import { aiService } from "@/lib//api/api-ai";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "ai";
  text: string;
}

const SUGGESTIONS = [
  "Tư vấn điện thoại dưới 10 triệu",
  "Laptop nào tốt cho lập trình?",
  "Theo dõi đơn hàng của tôi",
];

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: "Xin chào! Tôi là trợ lý thông minh của ShopTech. Tôi có thể giúp bạn chọn sản phẩm phù hợp, tra cứu thông số kỹ thuật hoặc giải đáp thắc mắc 24/7.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [msgs, open, isLoading]);

  // 🔴 LOGIC GỬI TIN NHẮN
  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 👉 THÊM LOGIC TRÍ NHỚ: Lấy 6 tin nhắn gần nhất và chuyển đổi thuộc tính 'text' thành 'content' cho khớp Backend
    const chatHistory = msgs.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.text,
    }));

    const newMsgs: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(newMsgs);
    setInput("");
    setIsLoading(true);

    try {
      // 👉 TRUYỀN HISTORY VÀO API
      const data = await aiService.sendChatMessage(text, conversationId, chatHistory);

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMsgs([...newMsgs, { role: "ai", text: data.reply }]);
    } catch (error: any) {
      console.error("Lỗi hệ thống chat:", error);

      let errorMsg =
        "Xin lỗi bạn, hệ thống AI của ShopTech đang bận xử lý dữ liệu. Bạn vui lòng thử lại sau nhé!";
      if (error.response?.status === 401) {
        errorMsg = "Vui lòng đăng nhập tài khoản để sử dụng chức năng trợ lý ảo tư vấn mua sắm!";
      }

      setMsgs([...newMsgs, { role: "ai", text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-hover)] transition hover:scale-105"
        style={{ background: "var(--gradient-hero)" }}
        aria-label="Chat AI"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[540px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-hover)]">
          <div
            className="flex items-center gap-2 p-4 text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold">Trợ lý ảo ShopTech AI</div>
              <div className="text-xs opacity-90">Mô hình Llama-3/Gemma-4 tích hợp</div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed overflow-hidden ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-secondary text-secondary-foreground rounded-tl-none border"
                  }`}
                >
                  {/* 🟢 Render Markdown */}
                  {m.role === "ai" ? (
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          />
                        ),
                        img: ({ node, ...props }) => (
                          <img
                            className="w-full max-w-[200px] rounded-lg mt-2 mb-2 object-cover border"
                            alt="Sản phẩm"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-2 last:mb-0 whitespace-pre-line" {...props} />
                        ),
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-line">{m.text}</span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start items-center gap-1 text-xs text-muted-foreground bg-secondary/40 max-w-[70%] px-3 py-2 rounded-2xl rounded-tl-none border">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>ShopTech AI đang suy nghĩ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!isLoading && msgs.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2 bg-card">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-primary/30 px-3 py-1 text-xs text-primary transition hover:bg-primary hover:text-primary-foreground bg-background"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t p-3 bg-background"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "Vui lòng đợi AI phản hồi..." : "Nhập câu hỏi của bạn..."}
              disabled={isLoading}
              className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
