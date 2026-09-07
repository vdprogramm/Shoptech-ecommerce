import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { liveChatClient } from '@/lib/socket/live-chat-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { MessageCircle, Send, User } from 'lucide-react';
import { authService } from '@/lib/api/api-auth';

export const Route = createFileRoute('/_site/merchant/chat')({
  component: LiveChatVendor,
});

function LiveChatVendor() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentUser = authService.getCurrentUser();
  const storeId = currentUser?.storeId;

  useEffect(() => {
    if (!storeId) return;

    fetchConversations();
    
    // Connect socket as vendor
    liveChatClient.connect('vendor', currentUser?._id, undefined, storeId);

    const handleReceiveMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      fetchConversations(); // Update list to show latest message
    };

    const handleConversationUpdated = (conv: any) => {
      fetchConversations();
    };

    liveChatClient.onReceiveMessage(handleReceiveMessage);
    liveChatClient.onConversationUpdated(handleConversationUpdated);

    return () => {
      liveChatClient.offReceiveMessage(handleReceiveMessage);
      liveChatClient.offConversationUpdated(handleConversationUpdated);
      liveChatClient.disconnect();
    };
  }, [storeId]);

  useEffect(() => {
    if (activeConv) {
      fetchHistory(activeConv._id);
      liveChatClient.joinConversation(activeConv._id);
    }
  }, [activeConv]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    if (!storeId) return;
    try {
      const res = await axios.get(`http://localhost:5000/live-chat/conversations?storeId=${storeId}`);
      setConversations(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async (convId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/live-chat/history/${convId}`);
      setMessages(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || !storeId) return;

    liveChatClient.sendMessage({
      senderRole: 'vendor',
      content: input,
      conversationId: activeConv._id,
      storeId: storeId,
      userId: currentUser?._id,
    });

    setInput('');
  };

  if (!storeId) {
    return <div className="p-4">Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-60px)] gap-4 p-4">
      {/* Conversations List */}
      <Card className="w-1/3 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Tin nhắn khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-slate-50 ${activeConv?._id === conv._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-semibold text-sm">
                      {conv.userId?.fullName || conv.customerName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {conv.lastMessage || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500">
                  Chưa có cuộc hội thoại nào
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            <CardHeader className="border-b px-6 py-4 bg-white">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {activeConv.userId?.fullName || activeConv.customerName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50">
              <ScrollArea className="flex-1 p-6">
                <div className="flex flex-col gap-4">
                  {messages.map((msg, idx) => {
                    const isVendor = msg.senderRole === 'vendor';
                    return (
                      <div
                        key={idx}
                        className={`flex w-full ${isVendor ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isVendor ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border'}`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <div className="border-t p-4 bg-white">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    placeholder="Nhập tin nhắn trả lời..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-slate-50"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim()} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 flex-col gap-2 bg-slate-50">
            <MessageCircle className="h-12 w-12 opacity-20" />
            <p>Chọn một cuộc hội thoại để bắt đầu chat</p>
          </div>
        )}
      </Card>
    </div>
  );
}
