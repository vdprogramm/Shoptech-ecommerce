import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { liveChatClient } from '@/lib/socket/live-chat-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { MessageCircle, Send, User } from 'lucide-react';

export const Route = createFileRoute('/_site/admin/live-chat')({
  component: LiveChatAdmin,
});

function LiveChatAdmin() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations();
    // Connect socket as admin
    liveChatClient.connect('admin');

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
  }, []);

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
    try {
      const res = await axios.get('http://localhost:5000/live-chat/conversations');
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
    if (!input.trim() || !activeConv) return;

    liveChatClient.sendMessage({
      senderRole: 'admin',
      content: input,
      conversationId: activeConv._id,
      // Pass the user ID or guest ID if needed, though conversationId is enough for backend
      userId: activeConv.userId?._id,
      guestId: activeConv.guestId,
    });

    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 p-4">
      {/* Conversations List */}
      <Card className="w-1/3 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Khách hàng đang Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-muted ${activeConv?._id === conv._id ? 'bg-muted border-l-4 border-primary' : ''}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-semibold text-sm">
                      {conv.userId?.fullName || conv.customerName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.lastMessage || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
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
            <CardHeader className="border-b px-6 py-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {activeConv.userId?.fullName || activeConv.customerName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="flex flex-col gap-4">
                  {messages.map((msg, idx) => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                      <div
                        key={idx}
                        className={`flex w-full ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isAdmin ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-secondary-foreground rounded-bl-sm'}`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-2">
            <MessageCircle className="h-12 w-12 opacity-20" />
            <p>Chọn một cuộc hội thoại để bắt đầu chat</p>
          </div>
        )}
      </Card>
    </div>
  );
}
