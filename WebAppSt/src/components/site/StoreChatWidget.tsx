import { MessageCircle, X, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { liveChatClient } from "@/lib/socket/live-chat-client";

interface Msg {
  role: "user" | "vendor" | "system";
  text: string;
}

export function StoreChatWidget({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "system",
      text: `Chào mừng bạn đến với ${storeName}. Bạn có cần hỗ trợ gì không?`,
    },
  ]);
  const [guestId, setGuestId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [msgs, open]);

  useEffect(() => {
    if (open) {
      const gId = 'guest_' + Math.random().toString(36).substr(2, 9);
      setGuestId(gId);
      
      // Pass guest role and storeId
      liveChatClient.connect('guest', undefined, gId, storeId);
      
      const handleReceive = (msg: any) => {
        // msg from vendor
        if (msg.senderRole === "vendor") {
          setMsgs((prev) => [...prev, { role: "vendor", text: msg.content }]);
        }
      };
      liveChatClient.onReceiveMessage(handleReceive);

      return () => {
        liveChatClient.offReceiveMessage(handleReceive);
        liveChatClient.disconnect();
      };
    }
  }, [open, storeId]);

  const send = async (text: string) => {
    if (!text.trim()) return;

    const newMsgs: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(newMsgs);
    setInput("");

    liveChatClient.sendMessage({
      senderRole: "guest",
      guestId: guestId,
      storeId: storeId,
      content: text,
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
      >
        <MessageCircle className="h-5 w-5" />
        <span>Chat với cửa hàng</span>
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[350px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between p-4 text-white bg-blue-600">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <StoreIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold line-clamp-1 text-sm">{storeName}</div>
                <div className="text-xs opacity-90">Trực tuyến</div>
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="text-white hover:bg-white/20 p-1 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-gray-50">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed overflow-hidden ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : m.role === "system"
                      ? "bg-transparent text-gray-500 border-none text-center italic text-xs mx-auto"
                      : "bg-white text-gray-800 rounded-tl-none border shadow-sm"
                  }`}
                >
                  <span className="whitespace-pre-line">{m.text}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t p-3 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V10l-7-5-7 5v11m14-2h-4v-4h4v4z" /></svg>
  );
}
