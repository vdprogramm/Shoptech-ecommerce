import { axiosClient } from "./axios-client";

export const aiService = {
  sendChatMessage: async (message: string, conversationId?: string | null, history: any[] = []) => {
    const response = await axiosClient.post("/ai/chat", {
      message,
      conversationId: conversationId || undefined,
      history,
    });
    return response.data;
  },

  getConversations: async () => {
    const response = await axiosClient.get("/ai/conversations");
    return response.data;
  },

  getChatMessages: async (conversationId: string) => {
    const response = await axiosClient.get(`/ai/messages/${conversationId}`);
    return response.data;
  },

  getAdminConversations: async (page: number = 1, limit: number = 20) => {
    const response = await axiosClient.get(`/ai/admin/conversations?page=${page}&limit=${limit}`);
    return response.data;
  },

  getAdminChatMessages: async (conversationId: string) => {
    const response = await axiosClient.get(`/ai/admin/conversations/${conversationId}/messages`);
    return response.data;
  },
};
