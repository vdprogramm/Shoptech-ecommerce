import { axiosClient } from "@/lib/api/axios-client";

export const adminUserService = {
  async getAllUsers() {
    const response = await axiosClient.get("/users");
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await axiosClient.delete(`/users/${id}`);
    return response.data;
  },

  async toggleActivation(id: string) {
    const response = await axiosClient.patch(`/users/${id}/toggle-activation`);
    return response.data;
  },

  createUserByAdmin: (data: any) => {
    return axiosClient.post("/users", data);
  },
};

export const apiAdminUser = adminUserService;
