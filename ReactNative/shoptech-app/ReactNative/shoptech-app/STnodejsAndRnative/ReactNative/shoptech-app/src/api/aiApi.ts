import axiosClient from './axiosClient';

const aiApi = {
    chatWithAI: (message: string, history: any[] = []) => {
        return axiosClient.post('/ai/chat', {
            message: message,
            history: history
        });
    },
};

export default aiApi;