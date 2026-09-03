import { axiosClient } from "./axios-client";

export const adminUserService = {
  async getAllUsers(): Promise<any[]> {
    const response = await axiosClient.get("/users");
    return response.data;
  },
  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete(`/users/${id}`);
    return response.data;
  },
  async updateRole(id: string, roles: string[]): Promise<any> {
    const response = await axiosClient.patch(`/users/${id}`, { roles });
    return response.data;
  },
  async createStaff(staffData: any): Promise<any> {
    const response = await axiosClient.post("/users/staff", staffData);
    return response.data;
  },
};
