import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { aiService } from "../../../lib/api/api-ai";
import {
  Bot,
  User,
  Clock,
  MessageSquare,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/admin/chatbot-history")({
  component: ChatbotHistoryPage,
});

function ChatbotHistoryPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  const fetchConversations = async (currentPage: number = page) => {
    setLoading(true);
    try {
      const result = await aiService.getAdminConversations(currentPage, 20);

      setConversations(result.data || []);
      setTotalPages(result.totalPages || 1);

      setError(null);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách hội thoại:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách hội thoại.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conv: any) => {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const data = await aiService.getAdminChatMessages(conv._id);
      setMessages(data);
    } catch (err: any) {
      console.error("Lỗi lấy tin nhắn:", err);
      toast.error("Không thể tải tin nhắn của hội thoại này.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations(page);
  }, [page]);

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  return (
    <div className="p-6 text-gray-900 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Lịch sử Chatbot
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Giám sát các cuộc trò chuyện giữa người dùng và trợ lý ảo AI.
          </p>
        </div>
        <button
          onClick={() => fetchConversations(page)}
          className="text-sm bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2 font-medium border border-gray-200"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
          <span className="text-red-500">⚠️</span> {error}
        </div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Danh sách hội thoại */}
        <div
          className={`flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${selectedConv ? "w-1/3" : "w-full"}`}
        >
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Tất cả cuộc hội thoại
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Đang tải dữ liệu...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Bot className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Chưa có cuộc trò chuyện nào.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => fetchMessages(conv)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 group border ${
                      selectedConv?._id === conv._id
                        ? "bg-indigo-50/80 border-indigo-100 shadow-sm"
                        : "bg-white border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {conv.userId ? conv.userId.fullName : "Khách vãng lai"}
                          </p>
                          {conv.userId?.email && (
                            <p className="text-[11px] text-gray-500 truncate">
                              {conv.userId.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="pl-10">
                      <p className="text-sm font-medium text-gray-700 truncate">{conv.title}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.updatedAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-gray-500">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Khung chat chi tiết */}
        {selectedConv && (
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
            <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConv.userId ? selectedConv.userId.fullName : "Khách vãng lai"}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedConv.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConv(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {messages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isUser ? "bg-indigo-100" : "bg-blue-100"
                            }`}
                          >
                            {isUser ? (
                              <User className="w-4 h-4 text-indigo-700" />
                            ) : (
                              <Bot className="w-4 h-4 text-blue-700" />
                            )}
                          </div>

                          <div
                            className={`p-4 rounded-2xl text-[15px] shadow-sm leading-relaxed ${
                              isUser
                                ? "bg-indigo-600 text-white rounded-tr-sm"
                                : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <div
                              className={`text-[10px] mt-2 text-right ${isUser ? "text-indigo-200" : "text-gray-400"}`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">Không có tin nhắn nào.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
