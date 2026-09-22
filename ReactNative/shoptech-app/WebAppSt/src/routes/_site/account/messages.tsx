import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { liveChatClient } from '@/lib/socket/live-chat-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { MessageCircle, Send, Store, ImageIcon, MoreVertical, Trash2 } from 'lucide-react';
import { authService } from '@/lib/api/api-auth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

export const Route = createFileRoute('/_site/account/messages')({
  component: CustomerMessages,
});

function CustomerMessages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentUser = authService.getCurrentUser();
  const userId = currentUser?._id;

  useEffect(() => {
    if (!userId) return;

    fetchConversations();
    
    // Connect socket as user
    liveChatClient.connect('user', userId);

    const handleReceiveMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      fetchConversations(); // Update list to show latest message
    };

    const handleConversationUpdated = (conv: any) => {
      fetchConversations();
    };

    const handleMessageRevoked = (data: { messageId: string }) => {
      setMessages((prev) => 
        prev.map(m => m._id === data.messageId ? { ...m, isRevoked: true } : m)
      );
    };

    liveChatClient.onReceiveMessage(handleReceiveMessage);
    liveChatClient.onConversationUpdated(handleConversationUpdated);
    liveChatClient.onMessageRevoked(handleMessageRevoked);

    return () => {
      liveChatClient.offReceiveMessage(handleReceiveMessage);
      liveChatClient.offConversationUpdated(handleConversationUpdated);
      liveChatClient.offMessageRevoked(handleMessageRevoked);
      liveChatClient.disconnect();
    };
  }, [userId]);

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
    if (!userId) return;
    try {
      const res = await axios.get(`https://shoptech-api-ytxj.onrender.com/live-chat/user-conversations?userId=${userId}`);
      setConversations(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async (convId: string) => {
    try {
      const res = await axios.get(`https://shoptech-api-ytxj.onrender.com/live-chat/history/${convId}`);
      setMessages(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv || !userId) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('https://shoptech-api-ytxj.onrender.com/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      const imageUrl = response.data.path;
      // Construct full URL
      const fullImageUrl = `https://shoptech-api-ytxj.onrender.com${imageUrl}`;

      liveChatClient.sendMessage({
        senderRole: 'user',
        content: 'Đã gửi một ảnh',
        imageUrl: fullImageUrl,
        conversationId: activeConv._id,
        storeId: activeConv.storeId._id,
        userId: userId,
        customerName: currentUser?.fullName || 'Khách hàng',
      });
      
      toast.success("Gửi ảnh thành công");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi upload ảnh");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || !userId) return;

    liveChatClient.sendMessage({
      senderRole: 'user',
      content: input,
      conversationId: activeConv._id,
      storeId: activeConv.storeId._id,
      userId: userId,
      customerName: currentUser?.fullName || 'Khách hàng',
    });

    setInput('');
  };

  const revokeMessage = (messageId: string) => {
    if (!userId || !activeConv) return;
    liveChatClient.revokeMessage({
      messageId,
      userId,
      storeId: activeConv.storeId._id
    });
  };

  if (!userId) {
    return <div className="p-4 text-center">Vui lòng đăng nhập để xem tin nhắn.</div>;
  }

  return (
    <div className="flex h-[600px] gap-4">
      {/* Conversations List */}
      <Card className="w-1/3 flex flex-col border shadow-sm">
        <CardHeader className="py-4 px-4 bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            Đoạn chat của bạn
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-muted/50 ${activeConv?._id === conv._id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border overflow-hidden">
                    {conv.storeId?.logoUrl ? (
                      <img src={conv.storeId.logoUrl} alt="Store logo" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-semibold text-sm">
                      {conv.storeId?.name || 'Cửa hàng'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.lastMessage || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Bạn chưa có cuộc trò chuyện nào
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 flex flex-col border shadow-sm overflow-hidden">
        {activeConv ? (
          <>
            <CardHeader className="border-b px-6 py-4 bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border overflow-hidden">
                  {activeConv.storeId?.logoUrl ? (
                    <img src={activeConv.storeId.logoUrl} alt="Store logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="text-base font-bold">{activeConv.storeId?.name || 'Cửa hàng'}</div>
                  <div className="text-xs font-normal text-muted-foreground">Phản hồi nhanh chóng</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/50">
              <ScrollArea className="flex-1 p-6">
                <div className="flex flex-col gap-4">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderRole === 'user' || msg.senderRole === 'guest';
                    return (
                      <div
                        key={idx}
                        className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-center gap-2 max-w-[75%]">
                          {isMe && !msg.isRevoked && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:bg-muted rounded-full">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-1" side="top">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive h-8 px-2 justify-start w-full"
                                  onClick={() => revokeMessage(msg._id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Thu hồi
                                </Button>
                              </PopoverContent>
                            </Popover>
                          )}
                          
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              msg.isRevoked 
                                ? 'bg-muted text-muted-foreground italic border border-dashed rounded-lg' 
                                : isMe 
                                  ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                  : 'bg-white text-foreground rounded-bl-sm border'
                            }`}
                          >
                            {msg.isRevoked ? (
                              'Tin nhắn đã bị thu hồi'
                            ) : (
                              <>
                                {msg.imageUrl && (
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="Đính kèm" 
                                    className="max-w-[200px] md:max-w-[250px] rounded-lg mb-1 object-cover cursor-pointer"
                                    onClick={() => window.open(msg.imageUrl, '_blank')}
                                  />
                                )}
                                <span>{msg.content}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <div className="border-t p-3 bg-white">
                <form onSubmit={sendMessage} className="flex gap-2 items-center">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-primary"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <ImageIcon className="h-5 w-5" />}
                  </Button>
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-full px-4"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim()} className="rounded-full shadow-md">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-3 bg-slate-50/50">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageCircle className="h-10 w-10 opacity-30" />
            </div>
            <p>Chọn một cuộc hội thoại để bắt đầu</p>
          </div>
        )}
      </Card>
    </div>
  );
}
